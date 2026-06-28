import { InstagramExtractionService } from '../services/instagramExtractionService.js';
import { Readable } from 'stream';
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

/**
 * Extracts metadata for Instagram reels / posts.
 */
export const extractReel = async (req, res, next) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'Instagram URL is required.' });
  }

  try {
    const extractedData = await InstagramExtractionService.extract(url);

    // Format proxied thumbnail URL locally using the request host headers to bypass referrer checks
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    extractedData.thumbnailUrl = `${baseUrl}/api/reels/proxy?url=${encodeURIComponent(extractedData.thumbnailUrl)}`;

    return res.status(200).json(extractedData);
  } catch (err) {
    console.error('[Instagram Controller] Extraction Failed:', err.message);
    next(err);
  }
};

/**
 * Streams/transcodes video files locally or proxy streams them directly from CDN.
 */
export const downloadProxy = async (req, res, next) => {
  const { url, name, quality, id } = req.query;

  try {
    const filename = name || 'savetube_reel.mp4';
    const targetQuality = (quality || 'BEST').toUpperCase();

    let qualityKey = 'high';
    if (targetQuality === 'SD' || targetQuality === 'LOW') {
      qualityKey = 'low';
    } else if (targetQuality === 'HD' || targetQuality === 'MEDIUM') {
      qualityKey = 'medium';
    }

    const localFilePath = id ? path.join(tempDir, `${id}_${qualityKey}.mp4`) : null;

    if (localFilePath && fs.existsSync(localFilePath)) {
      console.log(`[Instagram DownloadProxy] Serving pre-transcoded file: ${localFilePath}`);
      return res.download(localFilePath, filename, (err) => {
        if (err) {
          console.error('[Instagram DownloadProxy] Error serving file:', err.message);
        } else {
          console.log('[Instagram DownloadProxy] Successfully served', localFilePath);
        }
        setTimeout(() => {
          fs.unlink(localFilePath, (unlinkErr) => {
            if (unlinkErr && unlinkErr.code !== 'ENOENT') {
              console.error('[Instagram DownloadProxy] Failed to delete cache:', unlinkErr.message);
            }
          });
        }, 15000);
      });
    }

    if (!url) {
      return res.status(404).send('Transcoded file not found, and no fallback URL was provided.');
    }

    if (qualityKey === 'high') {
      console.log('[Instagram DownloadProxy] Streaming original High CDN URL directly.');
      const mediaResponse = await fetch(url);
      if (!mediaResponse.ok) {
        throw new Error(`CDN returned status ${mediaResponse.status}`);
      }
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', 'video/mp4');
      const nodeStream = Readable.fromWeb(mediaResponse.body);
      return nodeStream.pipe(res);
    }

    console.log(`[Instagram DownloadProxy] Falling back to on-the-fly transcoding for ${targetQuality}...`);
    
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'video/mp4');

    let command = ffmpeg(url)
      .format('mp4')
      .outputOptions([
        '-movflags frag_keyframe+empty_moov',
        '-preset ultrafast',
        '-vsync 0'
      ])
      .on('error', (err) => {
        console.error('[Instagram FFmpeg Error] Transcoding failed:', err.message);
        if (!res.headersSent) {
          res.status(500).send('Transcoding failed');
        }
      });

    if (qualityKey === 'medium') {
      command = command
        .videoCodec('libx264')
        .audioCodec('aac')
        .outputOptions([
          '-vf scale=-2:\'min(720,ih)\'',
          '-crf 26'
        ]);
    } else if (qualityKey === 'low') {
      command = command
        .videoCodec('libx264')
        .audioCodec('aac')
        .outputOptions([
          '-vf scale=-2:\'min(480,ih)\'',
          '-crf 32'
        ]);
    }

    command.pipe(res, { end: true });

  } catch (err) {
    console.error('[Instagram DownloadProxy] Failed:', err.message);
    if (!res.headersSent) {
      next(err);
    }
  }
};

/**
 * Proxy streams images from CDN to bypass referrer blocks.
 */
export const proxyMedia = async (req, res, next) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).send('URL query parameter is required.');
  }

  try {
    const mediaResponse = await fetch(url);
    if (!mediaResponse.ok) {
      throw new Error(`CDN returned status ${mediaResponse.status}`);
    }

    res.setHeader('Content-Type', mediaResponse.headers.get('content-type') || 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400');

    const nodeStream = Readable.fromWeb(mediaResponse.body);
    return nodeStream.pipe(res);
  } catch (err) {
    console.error('[Instagram ProxyMedia] Failed:', err.message);
    if (!res.headersSent) {
      res.status(500).send('Error proxying media');
    }
  }
};

/**
 * Temp files cleanup job.
 */
export const startCleanupJob = () => {
  console.log('[InstagramController] Cleanup Job initialized.');
  setInterval(() => {
    fs.readdir(tempDir, (err, files) => {
      if (err) return;
      files.forEach((file) => {
        const filePath = path.join(tempDir, file);
        fs.stat(filePath, (statErr, stats) => {
          if (statErr) return;
          const timeDiff = (Date.now() - stats.mtimeMs) / 1000 / 60; // in minutes
          if (timeDiff > 10) {
            fs.unlink(filePath, () => {});
          }
        });
      });
    });
  }, 600000);
};
