import mongoose from 'mongoose';

const ReelSchema = new mongoose.Schema({
  reelUrl: {
    type: String,
    required: [true, 'Reel URL is required'],
    unique: true,
    trim: true
  },
  videoUrl: {
    type: String,
    required: [true, 'Direct video URL is required']
  },
  thumbnail: {
    type: String,
    default: ''
  },
  username: {
    type: String,
    default: 'instagram.creator'
  },
  caption: {
    type: String,
    default: ''
  },
  downloadedAt: {
    type: Date,
    default: Date.now
  }
});

export const Reel = mongoose.model('Reel', ReelSchema);
