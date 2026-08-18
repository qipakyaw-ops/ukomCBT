import express from 'express';
import { getSettings, updateSettings } from '../controllers/userSettingsController.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/me/settings', authMiddleware, getSettings);
router.put('/me/settings', authMiddleware, updateSettings);

export default router;