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
  try {
    const filename = name || 'lumina_facebook.mp4';
    console.log(`[Facebook Proxy] Streaming video file: ${url}`);
    
    const mediaResponse = await fetch(url);
    if (!mediaResponse.ok) {
      throw new Error(`Facebook proxy stream failed: ${mediaResponse.status}`);
    }

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'video/mp4');

    const nodeStream = Readable.fromWeb(mediaResponse.body);
    return nodeStream.pipe(res);
  } catch (err) {
    console.error('[Facebook Proxy] Failed:', err.message);
    if (!res.headersSent) {
      next(err);
    }
  }
};
