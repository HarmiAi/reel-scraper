import express from 'express';
import { extractFacebookVideo, downloadFacebookProxy } from '../controllers/facebookController.js';

const router = express.Router();

router.post('/extract', extractFacebookVideo);
router.get('/downloadProxy', downloadFacebookProxy);

export default router;
