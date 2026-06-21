import { ReelExtractionService } from '../services/extractionService.js';
import { Reel } from '../models/Reel.js';
import { User } from '../models/User.js';
import { DownloadHistory } from '../models/DownloadHistory.js';
import { Readable } from 'stream';
import mongoose from 'mongoose';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

/**
 * @desc    Extract Reel metadata, save/update in database (if connected), and log history entry
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

    let databaseIds = null;

    // 2. Perform DB operations only if MongoDB connection is active
    if (mongoose.connection.readyState === 1) {
      try {
        // Ensure guest user exists in the database
        let guestUser = await User.findOne({ username: 'guest_user' });
        if (!guestUser) {
          guestUser = await User.create({
            username: 'guest_user',
            email: 'guest@lumina.reels'
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

    // 3. Return success metadata formatted for the client
    return res.status(200).json({
      id: extractedData.id,
      url: extractedData.url,
      username: extractedData.username,
      avatarUrl: extractedData.avatarUrl,
      caption: extractedData.caption,
      thumbnailUrl: extractedData.thumbnailUrl,
      videoUrl: extractedData.videoUrl,
      likes: extractedData.likes,
      comments: extractedData.comments,
      duration: extractedData.duration,
      verified: extractedData.verified,
      databaseIds
    });

  } catch (err) {
    console.error(`[ReelController] Extraction Failed:`, err.message);
    next(err);
  }
};

/**
 * @desc    Stream video bytes directly from Instagram CDNs to circumvent CORS blocks
 * @route   GET /api/reels/downloadProxy
 * @access  Public
 */
export const downloadProxy = async (req, res, next) => {
  const { url, name, quality } = req.query;

  if (!url) {
    return res.status(400).send('URL query parameter is required.');
  }

  try {
    const filename = name || 'lumina_reel.mp4';
    const targetQuality = (quality || '').toUpperCase();

    // If quality is BEST (or not specified), serve the original direct CDN file stream.
    // This completely avoids CPU usage and preserves 100% original quality for Best choice.
    if (targetQuality === 'BEST' || !targetQuality) {
      console.log(`[Express Proxy] Serving BEST quality (original stream) directly.`);
      
      const mediaResponse = await fetch(url);
      if (!mediaResponse.ok) {
        throw new Error(`CDN returned status ${mediaResponse.status}: ${mediaResponse.statusText}`);
      }

      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', mediaResponse.headers.get('content-type') || 'video/mp4');

      const nodeStream = Readable.fromWeb(mediaResponse.body);
      return nodeStream.pipe(res);
    }

    // Dynamic on-the-fly transcoding for HD (720p) and SD (480p) options
    console.log(`[Express Proxy] Transcoding stream to ${targetQuality} quality on-the-fly...`);
    
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
        console.error(`[FFmpeg Proxy Error] Transcoding failed:`, err.message);
        if (!res.headersSent) {
          res.status(500).send('Transcoding failed');
        }
      })
      .on('end', () => {
        console.log(`[Express Proxy] Successfully finished streaming transcoded ${targetQuality} video.`);
      });

    if (targetQuality === 'HD') {
      command = command
        .videoCodec('libx264')
        .audioCodec('aac')
        .size('?x720')
        .outputOptions([
          '-crf 26',
          '-vf scale=-2:\'min(720,ih)\'' // scale down only, never blow up size
        ]);
    } else if (targetQuality === 'SD') {
      command = command
        .videoCodec('libx264')
        .audioCodec('aac')
        .size('?x480')
        .outputOptions([
          '-crf 32',
          '-vf scale=-2:\'min(480,ih)\'' // scale down only, never blow up size
        ]);
    }

    command.pipe(res, { end: true });

  } catch (err) {
    console.error(`[Express Proxy] Stream failed:`, err.message);
    if (!res.headersSent) {
      next(err);
    }
  }
};
