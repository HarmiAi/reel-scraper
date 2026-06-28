/**
 * URL Validation Middleware
 */
export const normalizeInstagramUrl = (url) => {
  if (!url) return '';
  let cleaned = url.trim();
  
  try {
    cleaned = decodeURIComponent(cleaned);
  } catch (e) {}

  if (!/^https?:\/\//i.test(cleaned)) {
    cleaned = `https://${cleaned}`;
  }

  try {
    const parsed = new URL(cleaned);
    const match = parsed.pathname.match(/\/(?:[a-zA-Z0-9_\.]+\/)?(reel|reels|p|tv|r)\/([A-Za-z0-9_-]+)/i);
    if (match) {
      let type = match[1].toLowerCase();
      if (type === 'r' || type === 'reels') type = 'reel';
      const shortcode = match[2];
      return `https://www.instagram.com/${type}/${shortcode}/`;
    }
  } catch (e) {
    const match = cleaned.match(/(?:instagram\.com)\/(?:[a-zA-Z0-9_\.]+\/)?(reel|reels|p|tv|r)\/([A-Za-z0-9_-]+)/i);
    if (match) {
      let type = match[1].toLowerCase();
      if (type === 'r' || type === 'reels') type = 'reel';
      const shortcode = match[2];
      return `https://www.instagram.com/${type}/${shortcode}/`;
    }
  }

  return '';
};

export const validateInstagramUrl = (req, res, next) => {
  let url = req.body.url || req.query.url;

  if (!url) {
    return res.status(400).json({ 
      success: false, 
      error: 'Instagram URL is required.' 
    });
  }

  try {
    const normalizedUrl = normalizeInstagramUrl(url);

    if (!normalizedUrl || !/^https:\/\/www\.instagram\.com\/(reel|p|tv)\/[A-Za-z0-9_-]+\/$/i.test(normalizedUrl)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Link: The URL structure must point to a public Instagram /reel/, /p/, or /tv/ node.'
      });
    }

    if (req.body.url) req.body.url = normalizedUrl;
    if (req.query.url) req.query.url = normalizedUrl;

    next();
  } catch (err) {
    return res.status(400).json({
      success: false,
      error: 'Malformed URL: The provided URL is invalid or malformed.'
    });
  }
};

export const validateProxyUrl = (req, res, next) => {
  const url = req.body.url || req.query.url;

  if (!url) {
    return res.status(400).json({ 
      success: false, 
      error: 'Instagram URL is required for proxying.' 
    });
  }

  try {
    const parsedUrl = new URL(url.trim());

    if (parsedUrl.protocol !== 'https:') {
      return res.status(400).json({
        success: false,
        error: 'Security Error: Only secure HTTPS links are allowed.'
      });
    }

    const hostname = parsedUrl.hostname.toLowerCase();
    const isCdn = hostname.endsWith('instagram.com') || 
                  hostname.endsWith('cdninstagram.com') || 
                  hostname.endsWith('fbcdn.net');

    if (!isCdn) {
      return res.status(400).json({
        success: false,
        error: 'Security Error: Requested domain is not an authorized Instagram CDN.'
      });
    }

    next();
  } catch (err) {
    return res.status(400).json({
      success: false,
      error: 'Malformed URL: The provided CDN URL is invalid or malformed.'
    });
  }
};
