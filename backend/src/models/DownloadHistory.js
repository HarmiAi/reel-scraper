import mongoose from 'mongoose';

const DownloadHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  reelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Reel',
    required: [true, 'Reel ID is required']
  },
  downloadedAt: {
    type: Date,
    default: Date.now
  }
});

export const DownloadHistory = mongoose.model('DownloadHistory', DownloadHistorySchema);
