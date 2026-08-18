import express from 'express';
import { getDashboard } from '../controllers/adminController.js';
import { getReport, exportCsv } from '../controllers/reportsController.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import roleMiddleware from '../middlewares/role.middleware.js';

const router = express.Router();

router.get('/dashboard', authMiddleware, roleMiddleware(['admin']), getDashboard);
router.get('/reports', authMiddleware, roleMiddleware(['admin']), getReport);
router.get('/reports/export', authMiddleware, roleMiddleware(['admin']), exportCsv);

export default router;