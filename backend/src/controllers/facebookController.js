import { Readable } from 'stream';
import { FacebookExtractionService } from '../services/facebookExtractionService.js';

/**
 * Extracts metadata for Facebook videos / reels.
 * Returns real extracted data utilizing Puppeteer.
 */
export const extractFacebookVideo = async (req, res, next) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'Facebook URL is required.' });
  }

  try {
    const extractedData = await FacebookExtractionService.extract(url);
    return res.status(200).json(extractedData);
  } catch (err) {
    console.error('[Facebook Controller] Extraction failed:', err.message);
    next(err);
  }
};

/**
 * Streams Facebook video bytes directly to bypass browser CORS limitations.
 */
export const downloadFacebookProxy = async (req, res, next) => {
  const { url, name } = req.query;
  
  if (!url) {
    console.error('[Facebook Proxy Error] Download request missing url parameter.');
    return res.status(400).send('URL query parameter is required.');
  }

  const filename = name || 'savetube_facebook.mp4';
  console.log(`[Facebook Proxy] Pre-verifying video stream URL: ${url}`);

  try {
    // 1. Pre-verify the CDN URL using a premium browser User-Agent
    const mediaResponse = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Accept-Encoding': 'identity'
      }
    });

    console.log(`[Facebook Proxy Verify] CDN HTTP status: ${mediaResponse.status}`);

    if (!mediaResponse.ok) {
      const errorMsg = `Facebook CDN stream check failed: ${mediaResponse.status}`;
      console.error(`[Facebook Proxy Error] ${errorMsg}`);
      return res.status(mediaResponse.status).send(errorMsg);
    }

    const contentType = mediaResponse.headers.get('content-type') || '';
    const contentLength = mediaResponse.headers.get('content-length');

    console.log(`[Facebook Proxy Verify] Content-Type: ${contentType}`);
    console.log(`[Facebook Proxy Verify] Content-Length: ${contentLength} bytes`);

    // Verify it is indeed returning video streams or octet-stream
    if (contentType && !contentType.startsWith('video/') && !contentType.includes('octet-stream') && !contentType.includes('mp4')) {
      const typeError = `Media URL is not a valid video stream. Content-Type: ${contentType}`;
      console.error(`[Facebook Proxy Error] ${typeError}`);
      return res.status(400).send(typeError);
    }

    // 2. Write headers
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', contentType || 'video/mp4');
    if (contentLength && parseInt(contentLength, 10) > 0) {
      res.setHeader('Content-Length', contentLength);
    }

    console.log(`[Facebook Proxy Stream] Initializing byte transfer to client. Filename: ${filename}`);

    let bytesTransferred = 0;
    const nodeStream = Readable.fromWeb(mediaResponse.body);

    nodeStream.on('data', (chunk) => {
      bytesTransferred += chunk.length;
    });

    nodeStream.on('end', () => {
      console.log(`[Facebook Proxy Stream Finished] Successfully transferred ${bytesTransferred} bytes for ${filename}`);
    });

    nodeStream.on('error', (err) => {
      console.error(`[Facebook Proxy Stream Error] Socket error during transfer of ${filename}:`, err.message);
    });

    return nodeStream.pipe(res);

  } catch (err) {
    console.error('[Facebook Proxy Failed]', err);
    if (!res.headersSent) {
      res.status(500).send(`Facebook download proxy error: ${err.message}`);
    }
  }
};

