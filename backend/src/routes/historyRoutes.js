import express from 'express';
import { createHistoryLog, getRecentHistory, getUserHistory } from '../controllers/historyController.js';

const router = express.Router();

// Maps /api/history
router.post('/', createHistoryLog);
router.get('/', getRecentHistory);
router.get('/:userId', getUserHistory);

export default router;
