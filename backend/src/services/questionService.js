import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class QuestionService {
  async createQuestion(data) {
    const question = await prisma.question.create({
      data
    });
    return question;
  }

  async getAllQuestions(filters = {}) {
    const {
      category,
      subcategory,
      difficulty,
      type,
      search,
      page = 1,
      limit = 10
    } = filters;

    // ponytail: query params arrive as strings; Prisma needs Int for skip/take
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 10);

    const where = {};

    if (category) {
      where.category = category;
    }

    if (subcategory) {
      where.subcategory = subcategory;
    }

    if (difficulty) {
      where.difficulty = difficulty;
    }

    if (type) {
      where.type = type;
    }

    if (search) {
      where.OR = [
        { question: { contains: search, mode: 'insensitive' } },
        { vignette: { contains: search, mode: 'insensitive' } }
      ];
    }

    const skip = (pageNum - 1) * limitNum;

    const [questions, total] = await Promise.all([
      prisma.question.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.question.count({ where })
    ]);

    return {
      questions,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    };
  }

  async getQuestionFilters() {
    const [categories, subcategories, difficulties, types] = await Promise.all([
      prisma.question.groupBy({
        by: ['category'],
        orderBy: { category: 'asc' }
      }),
      prisma.question.groupBy({
        by: ['subcategory'],
        orderBy: { subcategory: 'asc' }
      }),
      prisma.question.groupBy({
        by: ['difficulty'],
        orderBy: { difficulty: 'asc' }
      }),
      prisma.question.groupBy({
        by: ['type'],
        orderBy: { type: 'asc' }
      })
    ]);

    const categorySubcategories = await prisma.question.groupBy({
      by: ['category', 'subcategory'],
      orderBy: [
        { category: 'asc' },
        { subcategory: 'asc' }
      ]
    });

    return {
      categories: categories.map((item) => item.category).filter(Boolean),
      subcategories: subcategories.map((item) => item.subcategory).filter(Boolean),
      difficulties: difficulties.map((item) => item.difficulty).filter(Boolean),
      types: types.map((item) => item.type).filter(Boolean),
      categorySubcategories: categorySubcategories
        .filter((item) => item.category && item.subcategory)
        .map((item) => ({ category: item.category, subcategory: item.subcategory }))
    };
  }

  async getQuestionById(id) {
    const question = await prisma.question.findUnique({
      where: { id }
    });
    return question;
  }

  async updateQuestion(id, data) {
    const question = await prisma.question.update({
      where: { id },
      data
    });
    return question;
  }

  async deleteQuestion(id) {
    const question = await prisma.question.delete({
      where: { id }
    });
    return question;
  }
}

export default new QuestionService();
