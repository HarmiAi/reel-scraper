import { DownloadHistory } from '../models/DownloadHistory.js';
import { User } from '../models/User.js';
import { Reel } from '../models/Reel.js';

/**
 * @desc    Create a download history log
 * @route   POST /api/history
 * @access  Public
 */
export const createHistoryLog = async (req, res, next) => {
  const { userId, reelId } = req.body;

  try {
    // Verify referenced items exist
    const userExists = await User.findById(userId);
    const reelExists = await Reel.findById(reelId);

    if (!userExists || !reelExists) {
      const err = new Error('Invalid User ID or Reel ID provided.');
      err.statusCode = 400;
      throw err;
    }

    const log = await DownloadHistory.create({
      userId,
      reelId,
      downloadedAt: new Date()
    });

    return res.status(201).json({
      success: true,
      data: log
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get recent global download history logs
 * @route   GET /api/history
 * @access  Public
 */
export const getRecentHistory = async (req, res, next) => {
  try {
    const logs = await DownloadHistory.find()
      .sort({ downloadedAt: -1 })
      .limit(10)
      .populate('userId')
      .populate('reelId');

    // Filter out items that might have missing populated refs
    const formattedLogs = logs
      .filter(log => log.userId && log.reelId)
      .map(log => {
        const shortcode = log.reelId.reelUrl.split('/').filter(Boolean).pop().split('?')[0];
        const charSum = shortcode.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
        return {
          id: shortcode,
          username: log.reelId.username,
          avatarUrl: `https://images.unsplash.com/photo-${1500000000000 + (charSum * 1000) % 999999}?auto=format&fit=crop&w=150&h=150&q=80`,
          caption: log.reelId.caption,
          thumbnailUrl: log.reelId.thumbnail,
          videoUrl: log.reelId.videoUrl,
          timestamp: log.downloadedAt
        };
      });

    return res.status(200).json({
      success: true,
      data: formattedLogs
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get download history logs for a specific user
 * @route   GET /api/history/:userId
 * @access  Public
 */
export const getUserHistory = async (req, res, next) => {
  const { userId } = req.params;

  try {
    const logs = await DownloadHistory.find({ userId })
      .sort({ downloadedAt: -1 })
      .limit(10)
      .populate('reelId');

    const formattedLogs = logs
      .filter(log => log.reelId)
      .map(log => {
        const shortcode = log.reelId.reelUrl.split('/').filter(Boolean).pop().split('?')[0];
        const charSum = shortcode.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
        return {
          id: shortcode,
          username: log.reelId.username,
          avatarUrl: `https://images.unsplash.com/photo-${1500000000000 + (charSum * 1000) % 999999}?auto=format&fit=crop&w=150&h=150&q=80`,
          caption: log.reelId.caption,
          thumbnailUrl: log.reelId.thumbnail,
          videoUrl: log.reelId.videoUrl,
          timestamp: log.downloadedAt
        };
      });

    return res.status(200).json({
      success: true,
      data: formattedLogs
    });
  } catch (err) {
    next(err);
  }
};
