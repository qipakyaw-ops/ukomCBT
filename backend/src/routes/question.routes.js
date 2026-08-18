import express from 'express';
import {
  getAllQuestions,
  getQuestionById,
  getQuestionFilters,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  importQuestions,
  deduplicateQuestions
} from '../controllers/questionController.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import roleMiddleware from '../middlewares/role.middleware.js';

const router = express.Router();

// GET routes - accessible to authenticated users
router.get('/filters', authMiddleware, getQuestionFilters);
router.get('/', authMiddleware, getAllQuestions);
router.get('/:id', authMiddleware, getQuestionById);

// POST, PUT, DELETE routes - admin only
router.post('/', authMiddleware, roleMiddleware(['admin']), createQuestion);
router.post('/import', authMiddleware, roleMiddleware(['admin']), importQuestions);
router.post('/deduplicate', authMiddleware, roleMiddleware(['admin']), deduplicateQuestions);
router.put('/:id', authMiddleware, roleMiddleware(['admin']), updateQuestion);
router.delete('/:id', authMiddleware, roleMiddleware(['admin']), deleteQuestion);

export default router;
