import express from 'express';
import { extractReel, downloadProxy } from '../controllers/reelController.js';
import { validateInstagramUrl } from '../middleware/urlValidation.js';

const router = express.Router();

// Maps /api/reels
router.post('/extract', validateInstagramUrl, extractReel);
router.get('/downloadProxy', validateInstagramUrl, downloadProxy);

export default router;
