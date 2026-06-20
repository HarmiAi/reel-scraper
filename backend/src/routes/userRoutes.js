import express from 'express';
import { createUser, getUserById } from '../controllers/userController.js';

const router = express.Router();

// Maps /api/users
router.post('/', createUser);
router.get('/:id', getUserById);

export default router;
