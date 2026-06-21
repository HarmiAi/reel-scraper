/**
 * URL Validation Middleware
 * Strict validation of Instagram Reels / Posts / TV URLs to secure the backend.
 * Rejects localhost, internal IPs, other social platforms (TikTok, YouTube), and malformed URLs.
 */
export const validateInstagramUrl = (req, res, next) => {
  const url = req.body.url || req.query.url;

  if (!url) {
    return res.status(400).json({ 
      success: false, 
      error: 'Instagram URL is required.' 
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

    // 2. Restrict to instagram.com and www.instagram.com domains
    // This implicitly rejects localhost, 127.0.0.1, internal network IPs, YouTube, TikTok, etc.
    const hostname = parsedUrl.hostname.toLowerCase();
    if (hostname !== 'instagram.com' && hostname !== 'www.instagram.com') {
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

    next();
  } catch (err) {
    return res.status(400).json({
      success: false,
      error: 'Malformed URL: The provided URL is invalid or malformed.'
    });
  }
};
