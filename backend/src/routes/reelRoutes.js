import express from 'express';
import { extractReel, downloadProxy } from '../controllers/reelController.js';

const router = express.Router();

// Maps /api/reels
router.post('/extract', extractReel);
router.get('/downloadProxy', downloadProxy);

export default router;
