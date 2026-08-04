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

export {
  getAllQuestions,
  getQuestionById,
  createQuestion,
  updateQuestion,
  deleteQuestion
};
