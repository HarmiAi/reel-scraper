/**
 * URL Validation Middleware
 * Strict validation of Instagram Reels / Posts / TV URLs to secure the backend.
 * Rejects localhost, internal IPs, other social platforms (TikTok, YouTube), and malformed URLs.
 */
export const validateInstagramUrl = (req, res, next) => {
  let url = req.body.url || req.query.url;

  if (!url) {
    return res.status(400).json({ 
      success: false, 
      error: 'Instagram URL is required.' 
    });
  }

  try {
    const cleanedUrl = url.trim();
    const parsedUrl = new URL(cleanedUrl);

    // 1. Enforce HTTPS protocol
    if (parsedUrl.protocol !== 'https:') {
      return res.status(400).json({
        success: false,
        error: 'Security Error: Only secure HTTPS links are allowed.'
      });
    }

    // 2. Restrict to instagram.com, www.instagram.com, and m.instagram.com domains
    const hostname = parsedUrl.hostname.toLowerCase();
    const allowedHosts = ['instagram.com', 'www.instagram.com', 'm.instagram.com'];
    if (!allowedHosts.includes(hostname)) {
      return res.status(400).json({
        success: false,
        error: 'Unsupported Platform: Only Instagram Reels, Posts, and TV links are allowed. TikTok, YouTube, and other URLs are not supported.'
      });
    }

    // 3. Ensure path is correct for posts/reels/tv
    const isPathValid = /^\/(reel|p|tv)\/[A-Za-z0-9_-]+/i.test(parsedUrl.pathname);
    if (!isPathValid) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Link: The URL structure must point to a public Instagram /reel/, /p/, or /tv/ node.'
      });
    }

    // 4. Normalize the URL: remove tracking query parameters
    const cleanPath = parsedUrl.pathname.endsWith('/') ? parsedUrl.pathname : `${parsedUrl.pathname}/`;
    const normalizedUrl = `${parsedUrl.protocol}//${parsedUrl.hostname}${cleanPath}`;

    // Update req parameters
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

/**
 * Proxy URL Validation Middleware
 * Validates that requested URLs point strictly to Instagram/Facebook CDN domains to prevent SSRF.
 */
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

    // 1. Enforce HTTPS protocol
    if (parsedUrl.protocol !== 'https:') {
      return res.status(400).json({
        success: false,
        error: 'Security Error: Only secure HTTPS links are allowed.'
      });
    }

    // 2. Restrict to valid Instagram/Facebook CDN domains
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

