import express from 'express';
import { createSession, updateSession, getSession, getSubmittedSessions } from '../controllers/cbtSessionController.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/', authMiddleware, getSubmittedSessions);
router.post('/', authMiddleware, createSession);
router.put('/:id', authMiddleware, updateSession);
router.get('/:id', authMiddleware, getSession);

export default router;
