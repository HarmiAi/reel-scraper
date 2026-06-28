import express from 'express';
import { sendContactEmail } from '../controllers/contactController.js';

const router = express.Router();

// Maps to /api/contact
router.post('/', sendContactEmail);

export default router;
