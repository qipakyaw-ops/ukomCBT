import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Map a raw CSV row to the Prisma Question schema shape.
// Options columns (pilihan_a..e / opsi_a..e) are combined into a JSON object.
function mapRowToQuestion(row) {
  const optionsObj = {
    A: row.pilihan_a || row.opsi_a || '',
    B: row.pilihan_b || row.opsi_b || '',
    C: row.pilihan_c || row.opsi_c || '',
    D: row.pilihan_d || row.opsi_d || '',
    E: row.pilihan_e || row.opsi_e || '',
  };
  const correctAnswer = (row.jawaban || row.kunci_jawaban || '').trim().toUpperCase();

  return {
    category: row.kategori || '',
    subcategory: row.subkategori || null,
    difficulty: row.tingkat_kesulitan || 'Sedang',
    type: row.type || 'normal',
    vignette: row.vignette || null,
    question: row.pertanyaan || '',
    options: JSON.stringify(optionsObj),
    correctAnswer,
    discussion: row.pembahasan || null,
    reference: row.referensi || null,
    image: row.image || null,
    imageCaption: row.image_caption || row.imageCaption || null,
  };
}

// Normalized uniqueness key: question text + vignette, case- and whitespace-insensitive.
function dedupKey(question, vignette) {
  return `${(question || '').trim().toLowerCase()}||${(vignette || '').trim().toLowerCase()}`;
}

// Load a set of existing dedup keys (question + vignette) from the DB.
async function loadExistingKeys() {
  const all = await prisma.question.findMany({
    select: { question: true, vignette: true },
  });
  return new Set(all.map((q) => dedupKey(q.question, q.vignette)));
}

// Check whether a question with the same text+vignette already exists.
async function existsDuplicate(question, vignette) {
  const count = await prisma.question.count({
    where: {
      question: { equals: (question || '').trim(), mode: 'insensitive' },
      vignette: { equals: (vignette || '').trim(), mode: 'insensitive' },
    },
  });
  return count > 0;
}

// Bulk-import questions from parsed CSV rows. Skips rows that match existing
// questions. Returns { imported, skipped }.
async function importQuestions(rows) {
  const result = { imported: 0, skipped: 0 };
  if (!Array.isArray(rows) || rows.length === 0) return result;

  const existing = await loadExistingKeys();
  const seen = new Set();
  const toInsert = [];

  rows.forEach((row) => {
    const mapped = mapRowToQuestion(row);
    const key = dedupKey(mapped.question, mapped.vignette);
    if (!mapped.question) return;
    if (existing.has(key) || seen.has(key)) {
      result.skipped += 1;
      return;
    }
    seen.add(key);
    toInsert.push(mapped);
  });

  if (toInsert.length > 0) {
    await prisma.question.createMany({ data: toInsert, skipDuplicates: true });
  }
  result.imported = toInsert.length;
  return result;
}

class QuestionService {
  async importQuestions(rows) {
    return importQuestions(rows);
  }

  async createQuestion(data) {
    // Prevention: reject if a question with the same text+vignette exists.
    const duplicate = await existsDuplicate(data.question, data.vignette);
    if (duplicate) {
      const err = new Error('Soal dengan teks/kasus yang sama sudah ada di database.');
      err.code = 'DUPLICATE_QUESTION';
      throw err;
    }
    const question = await prisma.question.create({ data });
    return question;
  }

  // One-time cleanup: remove duplicate questions (same text+vignette), keeping
  // the oldest (earliest createdAt). Returns { removed, checked }.
  async deduplicateQuestions() {
    const all = await prisma.question.findMany({
      select: { id: true, question: true, vignette: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });
    const seen = new Set();
    const seenKeys = new Set();
    const idsToDelete = [];
    all.forEach((q) => {
      const key = dedupKey(q.question, q.vignette);
      if (!q.question || seenKeys.has(key)) {
        idsToDelete.push(q.id);
        return;
      }
      seenKeys.add(key);
      seen.add(q.id);
    });
    if (idsToDelete.length > 0) {
      await prisma.question.deleteMany({ where: { id: { in: idsToDelete } } });
    }
    return { checked: all.length, removed: idsToDelete.length };
  }

  async getAllQuestions(filters = {}) {
    const {
      category,
      subcategory,
      difficulty,
      type,
      search,
      page = 1,
      limit = 20
    } = filters;

    // ponytail: query params arrive as strings; Prisma needs Int for skip/take
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 20);

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
        totalPages: Math.ceil(total / limitNum),
        currentPage: pageNum,
        totalItems: total,
        itemsPerPage: limitNum
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
