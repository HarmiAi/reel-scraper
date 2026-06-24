import { ReelExtractionService } from '../services/extractionService.js';
import { Reel } from '../models/Reel.js';
import { User } from '../models/User.js';
import { DownloadHistory } from '../models/DownloadHistory.js';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';
import mongoose from 'mongoose';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import fs from 'fs';
import path from 'path';

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

const tempDir = path.join(process.cwd(), 'temp');

// Ensure temp directory exists
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Helper to download media file from URL
async function downloadMedia(url, outputPath) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`CDN returned status ${response.status}: ${response.statusText}`);
  }
  const fileStream = fs.createWriteStream(outputPath);
  await pipeline(Readable.fromWeb(response.body), fileStream);
}

// Helper to transcode video
function transcodeVideo(inputPath, outputPath, quality) {
  return new Promise((resolve, reject) => {
    let command = ffmpeg(inputPath)
      .format('mp4')
      .outputOptions([
        '-preset ultrafast',
        '-movflags +faststart'
      ]);

    if (quality === 'low') {
      command = command
        .videoCodec('libx264')
        .audioCodec('aac')
        .outputOptions([
          '-vf scale=-2:480',
          '-b:v 800k',
          '-b:a 128k'
        ]);
    } else if (quality === 'medium') {
      command = command
        .videoCodec('libx264')
        .audioCodec('aac')
        .outputOptions([
          '-vf scale=-2:720',
          '-b:v 1500k',
          '-b:a 128k'
        ]);
    }

    command
      .on('end', () => {
        resolve();
      })
      .on('error', (err) => {
        console.error(`[FFmpeg Error] Transcoding failed for ${quality}:`, err.message);
        reject(err);
      })
      .save(outputPath);
  });
}

// Format bytes to MB/KB
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = 1;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * @desc    Extract Reel metadata, save/update in database (if connected), transcode to Low/Medium/High, and log history entry
 * @route   POST /api/reels/extract
 * @access  Public
 */
export const extractReel = async (req, res, next) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'Instagram URL is required.' });
  }

  try {
    // 1. Extract metadata from Instagram CDN
    const extractedData = await ReelExtractionService.extract(url);
    const id = extractedData.id;

    // 2. Download and transcode the video files to get actual sizes and store cache
    const originalPath = path.join(tempDir, `original_${id}.mp4`);
    const lowPath = path.join(tempDir, `${id}_low.mp4`);
    const mediumPath = path.join(tempDir, `${id}_medium.mp4`);
    const highPath = path.join(tempDir, `${id}_high.mp4`);

    console.log(`[ReelController] Downloading original video for transcoding: ${extractedData.videoUrl}`);
    await downloadMedia(extractedData.videoUrl, originalPath);

    console.log(`[ReelController] Transcoding to Low (480p)...`);
    await transcodeVideo(originalPath, lowPath, 'low');

    console.log(`[ReelController] Transcoding to Medium (720p)...`);
    await transcodeVideo(originalPath, mediumPath, 'medium');

    console.log(`[ReelController] Copying to High (Original)...`);
    fs.copyFileSync(originalPath, highPath);

    // Clean up original temp file
    try {
      fs.unlinkSync(originalPath);
    } catch (err) {
      console.error(`[ReelController] Error deleting original temp file:`, err.message);
    }

    // Get exact file sizes
    const lowSizeVal = fs.statSync(lowPath).size;
    const mediumSizeVal = fs.statSync(mediumPath).size;
    const highSizeVal = fs.statSync(highPath).size;

    const lowSize = formatBytes(lowSizeVal);
    const mediumSize = formatBytes(mediumSizeVal);
    const highSize = formatBytes(highSizeVal);

    console.log(`[ReelController] Transcoding complete. Sizes - Low: ${lowSize}, Medium: ${mediumSize}, High: ${highSize}`);

    let databaseIds = null;

    // 3. Perform DB operations only if MongoDB connection is active
    if (mongoose.connection.readyState === 1) {
      try {
        // Ensure guest user exists in the database
        let guestUser = await User.findOne({ username: 'guest_user' });
        if (!guestUser) {
          guestUser = await User.create({
            username: 'guest_user',
            email: 'guest@savetube.app'
          });
        }

        // Upsert Reel document in the database
        let reel = await Reel.findOne({ reelUrl: extractedData.url });
        if (reel) {
          // Update with latest direct CDN links since Instagram CDN links expire
          reel.videoUrl = extractedData.videoUrl;
          reel.thumbnail = extractedData.thumbnailUrl;
          reel.caption = extractedData.caption;
          reel.downloadedAt = new Date();
          await reel.save();
        } else {
          reel = await Reel.create({
            reelUrl: extractedData.url,
            videoUrl: extractedData.videoUrl,
            thumbnail: extractedData.thumbnailUrl,
            username: extractedData.username,
            caption: extractedData.caption,
            downloadedAt: new Date()
          });
        }

        // Log download history
        await DownloadHistory.create({
          userId: guestUser._id,
          reelId: reel._id,
          downloadedAt: new Date()
        });

        databaseIds = {
          userId: guestUser._id,
          reelId: reel._id
        };
        console.log(`[ReelController] Successfully saved Reel and log to MongoDB Atlas.`);
      } catch (dbErr) {
        console.warn(`[ReelController] Mongoose DB transaction skipped/failed:`, dbErr.message);
      }
    } else {
      console.log(`[ReelController] Database offline. Returning extracted metadata without MongoDB logging.`);
    }

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const proxiedThumbnailUrl = `${baseUrl}/api/reels/proxy?url=${encodeURIComponent(extractedData.thumbnailUrl)}`;

    // 4. Return success metadata formatted for the client
    return res.status(200).json({
      id: extractedData.id,
      url: extractedData.url,
      username: extractedData.username,
      avatarUrl: extractedData.avatarUrl,
      caption: extractedData.caption,
      thumbnailUrl: proxiedThumbnailUrl,
      videoUrl: extractedData.videoUrl,
      likes: extractedData.likes,
      comments: extractedData.comments,
      duration: extractedData.duration,
      verified: extractedData.verified,
      lowSize,
      mediumSize,
      highSize,
      databaseIds
    });

  } catch (err) {
    console.error(`[ReelController] Extraction Failed:`, err.message);
    next(err);
  }
};

/**
 * @desc    Stream video bytes directly from local transcoded cache or fall back to CDN on-the-fly transcode
 * @route   GET /api/reels/downloadProxy
 * @access  Public
 */
export const downloadProxy = async (req, res, next) => {
  const { url, name, quality, id } = req.query;

  try {
    const filename = name || 'savetube_reel.mp4';
    const targetQuality = (quality || 'BEST').toUpperCase();

    // Mapping quality parameter to local file suffix
    let qualityKey = 'high';
    if (targetQuality === 'SD' || targetQuality === 'LOW') {
      qualityKey = 'low';
    } else if (targetQuality === 'HD' || targetQuality === 'MEDIUM') {
      qualityKey = 'medium';
    }

    // Check if the pre-transcoded file exists
    const localFilePath = id ? path.join(tempDir, `${id}_${qualityKey}.mp4`) : null;

    if (localFilePath && fs.existsSync(localFilePath)) {
      console.log(`[DownloadProxy] Serving pre-transcoded file: ${localFilePath}`);
      return res.download(localFilePath, filename, (err) => {
        if (err) {
          console.error(`[DownloadProxy] Error serving file:`, err.message);
        } else {
          console.log(`[DownloadProxy] Successfully served ${localFilePath}`);
        }
        // Set a timeout of 15 seconds before deleting the file.
        // This avoids race conditions with range requests/connection retries from browser download managers.
        setTimeout(() => {
          fs.unlink(localFilePath, (unlinkErr) => {
            if (unlinkErr && unlinkErr.code !== 'ENOENT') {
              console.error(`[DownloadProxy] Failed to delete ${localFilePath}:`, unlinkErr.message);
            } else if (!unlinkErr) {
              console.log(`[DownloadProxy] Cleaned up file: ${localFilePath}`);
            }
          });
        }, 15000);
      });
    }

    // Fallback: If local pre-transcoded file is missing, stream/transcode from the CDN URL
    if (!url) {
      return res.status(404).send('Transcoded file not found, and no fallback CDN URL was provided.');
    }

    if (qualityKey === 'high') {
      console.log(`[DownloadProxy] Pre-transcoded high file missing. Streaming original CDN URL directly.`);
      const mediaResponse = await fetch(url);
      if (!mediaResponse.ok) {
        throw new Error(`CDN returned status ${mediaResponse.status}: ${mediaResponse.statusText}`);
      }
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', mediaResponse.headers.get('content-type') || 'video/mp4');
      const nodeStream = Readable.fromWeb(mediaResponse.body);
      return nodeStream.pipe(res);
    }

    console.log(`[DownloadProxy] Pre-transcoded file not found. Falling back to on-the-fly transcoding for ${targetQuality}...`);
    
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'video/mp4');

    let command = ffmpeg(url)
      .format('mp4')
      .outputOptions([
        '-movflags frag_keyframe+empty_moov', // allows output to be streamed to response
        '-preset ultrafast',                  // fast compression preset
        '-vsync 0'                            // prevent sync warnings
      ])
      .on('error', (err) => {
        console.error(`[FFmpeg Proxy Error] On-the-fly transcoding failed:`, err.message);
        if (!res.headersSent) {
          res.status(500).send('Transcoding failed');
        }
      })
      .on('end', () => {
        console.log(`[DownloadProxy] Successfully finished streaming on-the-fly transcoded ${targetQuality} video.`);
      });

    if (qualityKey === 'medium') {
      command = command
        .videoCodec('libx264')
        .audioCodec('aac')
        .outputOptions([
          '-vf scale=-2:\'min(720,ih)\'', // scale down only, never blow up size
          '-crf 26'
        ]);
    } else if (qualityKey === 'low') {
      command = command
        .videoCodec('libx264')
        .audioCodec('aac')
        .outputOptions([
          '-vf scale=-2:\'min(480,ih)\'', // scale down only, never blow up size
          '-crf 32'
        ]);
    }

    command.pipe(res, { end: true });

  } catch (err) {
    console.error(`[DownloadProxy] Error:`, err.message);
    if (!res.headersSent) {
      next(err);
    }
  }
};

/**
 * @desc    Fetch and stream media/thumbnails from CDN to bypass CORS/Referrer blocks
 * @route   GET /api/reels/proxy
 * @access  Public
 */
export const proxyMedia = async (req, res, next) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).send('URL query parameter is required.');
  }

  try {
    console.log(`[ProxyMedia] Fetching and streaming: ${url}`);
    const mediaResponse = await fetch(url);
    if (!mediaResponse.ok) {
      throw new Error(`CDN returned status ${mediaResponse.status}: ${mediaResponse.statusText}`);
    }

    // Set appropriate headers
    res.setHeader('Content-Type', mediaResponse.headers.get('content-type') || 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24h

    const nodeStream = Readable.fromWeb(mediaResponse.body);
    return nodeStream.pipe(res);
  } catch (err) {
    console.error(`[ProxyMedia] Error proxying media:`, err.message);
    if (!res.headersSent) {
      res.status(500).send('Error proxying media');
    }
  }
};

/**
 * Cleanup job to delete files older than 10 minutes from the temp folder
 */
export const startCleanupJob = () => {
  console.log('[ReelController] Cleanup Job initialized.');
  setInterval(() => {
    console.log('[Cleanup Job] Scanning temp directory for expired files...');
    fs.readdir(tempDir, (err, files) => {
      if (err) {
        console.error('[Cleanup Job] Error reading temp directory:', err.message);
        return;
      }

      const now = Date.now();
      const expirationTime = 10 * 60 * 1000; // 10 minutes

      files.forEach((file) => {
        if (file.startsWith('.')) return;

        const filePath = path.join(tempDir, file);
        fs.stat(filePath, (statErr, stats) => {
          if (statErr) {
            console.error(`[Cleanup Job] Error statting file ${file}:`, statErr.message);
            return;
          }

          if (now - stats.mtimeMs > expirationTime) {
            fs.unlink(filePath, (unlinkErr) => {
              if (unlinkErr) {
                console.error(`[Cleanup Job] Error deleting file ${file}:`, unlinkErr.message);
              } else {
                console.log(`[Cleanup Job] Deleted expired temp file: ${file}`);
              }
            });
          }
        });
      });
    });
  }, 5 * 60 * 1000); // run every 5 minutes
};
