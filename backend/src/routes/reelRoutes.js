import express from 'express';
import { extractReel, downloadProxy, proxyMedia } from '../controllers/reelController.js';
import { validateInstagramUrl, validateProxyUrl } from '../middleware/urlValidation.js';

const router = express.Router();

// Maps /api/reels
router.post('/extract', validateInstagramUrl, extractReel);
router.get('/downloadProxy', validateProxyUrl, downloadProxy);
router.get('/proxy', validateProxyUrl, proxyMedia);

export default router;

