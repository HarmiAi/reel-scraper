import { Readable } from 'stream';

/**
 * Extracts metadata for Facebook videos / reels.
 * Returns simulated data pointing to public test video stream containers.
 */
export const extractFacebookVideo = async (req, res, next) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'Facebook URL is required.' });
  }

  try {
    const videoId = 'fb_' + Math.random().toString(36).substring(2, 10);
    const testVideoUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';
    const testThumbnail = 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=500';

    return res.status(200).json({
      id: videoId,
      url: url.trim(),
      username: 'fb_creator_suite',
      avatarUrl: 'https://cdn-icons-png.flaticon.com/512/124/124010.png',
      caption: 'Building the future of social media creator workflows with Lumina. 🚀 #lumina #creators #facebook',
      thumbnailUrl: testThumbnail,
      videoUrl: testVideoUrl,
      likes: '45.2K',
      comments: '1.2K',
      duration: '0:15',
      verified: true,
      lowSize: '2.4 MB',
      mediumSize: '4.8 MB',
      highSize: '9.6 MB'
    });
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
