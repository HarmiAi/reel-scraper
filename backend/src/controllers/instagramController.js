import { InstagramExtractionService } from '../services/instagramExtractionService.js';
import { Readable, PassThrough } from 'stream';
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

    // Check cached pre-transcoded file
    if (localFilePath && fs.existsSync(localFilePath)) {
      const cachedStats = fs.statSync(localFilePath);
      if (cachedStats.size === 0) {
        console.error(`[Instagram DownloadProxy Error] Cached file size is 0 bytes: ${localFilePath}`);
        try {
          fs.unlinkSync(localFilePath);
        } catch (unlinkErr) {}
      } else {
        console.log(`[Instagram DownloadProxy] Serving pre-transcoded file: ${localFilePath} (${cachedStats.size} bytes)`);
        return res.download(localFilePath, filename, (err) => {
          if (err) {
            console.error('[Instagram DownloadProxy Error] Error serving file:', err.message);
          } else {
            console.log('[Instagram DownloadProxy] Successfully served', localFilePath);
          }
          setTimeout(() => {
            fs.unlink(localFilePath, (unlinkErr) => {
              if (unlinkErr && unlinkErr.code !== 'ENOENT') {
                console.error('[Instagram DownloadProxy Error] Failed to delete cache:', unlinkErr.message);
              }
            });
          }, 15000);
        });
      }
    }

    if (!url) {
      console.error('[Instagram DownloadProxy Error] Download request missing url parameter.');
      return res.status(400).send('URL query parameter is required.');
    }

    // Pre-verify the CDN URL using a premium browser User-Agent
    console.log(`[Instagram DownloadProxy] Pre-verifying video stream URL: ${url}`);
    const mediaResponse = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Accept-Encoding': 'identity'
      }
    });

    console.log(`[Instagram DownloadProxy Verify] CDN HTTP status: ${mediaResponse.status}`);

    if (!mediaResponse.ok) {
      const errorMsg = `Instagram CDN stream check failed: ${mediaResponse.status}`;
      console.error(`[Instagram DownloadProxy Error] ${errorMsg}`);
      return res.status(mediaResponse.status).send(errorMsg);
    }

    const contentType = mediaResponse.headers.get('content-type') || '';
    const contentLength = mediaResponse.headers.get('content-length');

    console.log(`[Instagram DownloadProxy Verify] Content-Type: ${contentType}`);
    console.log(`[Instagram DownloadProxy Verify] Content-Length: ${contentLength} bytes`);

    // Verify it is indeed returning video streams or octet-stream
    if (contentType && !contentType.startsWith('video/') && !contentType.includes('octet-stream') && !contentType.includes('mp4')) {
      const typeError = `Media URL is not a valid video stream. Content-Type: ${contentType}`;
      console.error(`[Instagram DownloadProxy Error] ${typeError}`);
      return res.status(400).send(typeError);
    }

    if (qualityKey === 'high') {
      console.log('[Instagram DownloadProxy] Streaming original High CDN URL directly.');
      
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', contentType || 'video/mp4');
      if (contentLength && parseInt(contentLength, 10) > 0) {
        res.setHeader('Content-Length', contentLength);
      }

      console.log(`[Instagram DownloadProxy Stream] Initializing byte transfer to client. Filename: ${filename}`);

      let bytesTransferred = 0;
      const nodeStream = Readable.fromWeb(mediaResponse.body);

      nodeStream.on('data', (chunk) => {
        bytesTransferred += chunk.length;
      });

      nodeStream.on('end', () => {
        console.log(`[Instagram DownloadProxy Stream Finished] Successfully transferred ${bytesTransferred} bytes for ${filename}`);
      });

      nodeStream.on('error', (err) => {
        console.error(`[Instagram DownloadProxy Stream Error] Socket error during transfer of ${filename}:`, err.message);
      });

      return nodeStream.pipe(res);
    }

    console.log(`[Instagram DownloadProxy] Falling back to on-the-fly transcoding for ${targetQuality}...`);
    
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'video/mp4');

    let command = ffmpeg(url)
      // Inject browser User-Agent to prevent FFmpeg request from being blocked with a 403
      .inputOptions([
        '-user_agent "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"'
      ])
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

    const monitor = new PassThrough();
    let bytesTransferred = 0;
    
    monitor.on('data', (chunk) => {
      bytesTransferred += chunk.length;
    });

    monitor.on('end', () => {
      console.log(`[Instagram Transcode Stream Finished] Successfully transferred ${bytesTransferred} bytes for ${filename}`);
    });

    command.pipe(monitor).pipe(res);

  } catch (err) {
    console.error('[Instagram DownloadProxy Failed]', err);
    if (!res.headersSent) {
      res.status(500).send(`Instagram download proxy error: ${err.message}`);
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
