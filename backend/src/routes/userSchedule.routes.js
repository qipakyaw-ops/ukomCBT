import express from 'express';
import { getSchedule, updateSchedule } from '../controllers/userScheduleController.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/me/schedule', authMiddleware, getSchedule);
router.put('/me/schedule', authMiddleware, updateSchedule);

export default router;