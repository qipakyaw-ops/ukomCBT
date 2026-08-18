import express from 'express';
import { getBookmarks, addBookmark, removeBookmark } from '../controllers/cbtBookmarkController.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/', authMiddleware, getBookmarks);
router.post('/', authMiddleware, addBookmark);
router.delete('/:questionId', authMiddleware, removeBookmark);

export default router;
