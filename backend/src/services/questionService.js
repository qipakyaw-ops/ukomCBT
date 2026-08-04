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

    const skip = (page - 1) * limit;

    const [questions, total] = await Promise.all([
      prisma.question.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.question.count({ where })
    ]);

    return {
      questions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
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
