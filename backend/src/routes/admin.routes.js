import express from 'express';
import { getDashboard } from '../controllers/adminController.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import roleMiddleware from '../middlewares/role.middleware.js';

const router = express.Router();

router.get('/dashboard', authMiddleware, roleMiddleware(['admin']), getDashboard);

export default router;