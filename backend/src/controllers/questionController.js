import questionService from '../services/questionService.js';

const getAllQuestions = async (req, res) => {
  try {
    const filters = {
      category: req.query.category,
      subcategory: req.query.subcategory,
      difficulty: req.query.difficulty,
      type: req.query.type,
      search: req.query.search,
      page: req.query.page,
      limit: req.query.limit
    };

    const result = await questionService.getAllQuestions(filters);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get questions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get questions'
    });
  }
};

const getQuestionById = async (req, res) => {
  try {
    const { id } = req.params;
    const question = await questionService.getQuestionById(id);

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    res.json({
      success: true,
      data: { question }
    });
  } catch (error) {
    console.error('Get question error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get question'
    });
  }
};

const getQuestionFilters = async (req, res) => {
  try {
    const filters = await questionService.getQuestionFilters();

    res.json({
      success: true,
      data: filters
    });
  } catch (error) {
    console.error('Get question filters error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get question filters'
    });
  }
};

const createQuestion = async (req, res) => {
  try {
    const questionData = req.body;

    const question = await questionService.createQuestion(questionData);

    res.status(201).json({
      success: true,
      message: 'Question created successfully',
      data: { question }
    });
  } catch (error) {
    if (error.code === 'DUPLICATE_QUESTION') {
      return res.status(400).json({
        success: false,
        message: 'Soal dengan teks/kasus yang sama sudah ada di database.'
      });
    }
    console.error('Create question error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create question'
    });
  }
};

const updateQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const questionData = req.body;

    const question = await questionService.updateQuestion(id, questionData);

    res.json({
      success: true,
      message: 'Question updated successfully',
      data: { question }
    });
  } catch (error) {
    console.error('Update question error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to update question'
    });
  }
};

const deleteQuestion = async (req, res) => {
  try {
    const { id } = req.params;

    await questionService.deleteQuestion(id);

    res.json({
      success: true,
      message: 'Question deleted successfully'
    });
  } catch (error) {
    console.error('Delete question error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to delete question'
    });
  }
};

const importQuestions = async (req, res) => {
  try {
    const { rows } = req.body;
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'rows must be a non-empty array'
      });
    }
    const { imported, skipped } = await questionService.importQuestions(rows);
    res.status(201).json({
      success: true,
      imported,
      skipped,
      message: `${imported} soal di-import, ${skipped} soal duplikat dilewati`
    });
  } catch (error) {
    console.error('Import questions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to import questions'
    });
  }
};

const deduplicateQuestions = async (req, res) => {
  try {
    const result = await questionService.deduplicateQuestions();
    res.json({
      success: true,
      ...result,
      message: `${result.removed} soal duplikat dihapus`
    });
  } catch (error) {
    console.error('Deduplicate questions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to deduplicate questions'
    });
  }
};

const fixOptionsJson = async (req, res) => {
  try {
    const result = await questionService.fixOptionsJson();
    res.json({ success: true, ...result, message: `${result.fixed} soal diperbaiki` });
  } catch (error) {
    console.error('Fix options JSON error:', error);
    res.status(500).json({ success: false, message: 'Failed to fix options JSON' });
  }
};

export {
  getAllQuestions,
  getQuestionById,
  getQuestionFilters,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  importQuestions,
  deduplicateQuestions,
  fixOptionsJson
};
