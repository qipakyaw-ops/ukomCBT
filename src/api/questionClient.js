const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

function normalizeOptionsToBackend(options) {
  if (Array.isArray(options)) {
    const optionMap = {};
    options.forEach(opt => {
      if (opt && opt.id) {
        optionMap[opt.id] = opt.text || '';
      }
    });
    return optionMap;
  }
  if (typeof options === 'object' && options !== null) {
    return options;
  }
  return { A: '', B: '', C: '', D: '', E: '' };
}

function normalizeOptionsFromBackend(options) {
  if (typeof options === 'object' && options !== null) {
    return Object.entries(options).map(([id, text]) => ({
      id: String(id).toUpperCase(),
      text: String(text || '')
    })).filter(opt => opt.id && opt.text);
  }
  return [];
}

function normalizeQuestionFromBackend(backendQuestion) {
  const q = backendQuestion || {};
  const options = normalizeOptionsFromBackend(q.options);
  const optionMap = Object.fromEntries(options.map(opt => [opt.id, opt.text]));

  return {
    id: q.id,
    kategori: q.category || '',
    subkategori: q.subcategory || '',
    tingkatKesulitan: q.difficulty || '',
    type: q.type || 'normal',
    vignette: q.vignette || '',
    image: q.image || '',
    imageCaption: q.imageCaption || '',
    pertanyaan: q.question || '',
    pilihan: {
      A: optionMap.A || '',
      B: optionMap.B || '',
      C: optionMap.C || '',
      D: optionMap.D || '',
      E: optionMap.E || '',
    },
    jawabanBenar: (q.correctAnswer || '').toUpperCase(),
    pembahasan: q.discussion || '',
    referensi: q.reference || '',
    tag: [],
    category: q.category || '',
    subcategory: q.subcategory || '',
    difficulty: q.difficulty || '',
    question: q.question || '',
    correctAnswer: q.correctAnswer || '',
    discussion: q.discussion || '',
    reference: q.reference || '',
    createdAt: q.createdAt,
    updatedAt: q.updatedAt,
    options,
  };
}

function normalizeQuestionToBackend(frontendQuestion) {
  const q = frontendQuestion || {};
  const options = normalizeOptionsToBackend(q.options || q.pilihan);

  return {
    category: q.category || q.kategori || '',
    subcategory: q.subcategory || q.subkategori || '',
    difficulty: q.difficulty || q.tingkatKesulitan || '',
    type: q.type || q.questionType || 'normal',
    vignette: q.vignette || '',
    image: q.image || '',
    imageCaption: q.imageCaption || '',
    question: q.question || q.pertanyaan || '',
    options,
    correctAnswer: (q.correctAnswer || q.jawabanBenar || '').toUpperCase(),
    discussion: q.discussion || q.pembahasan || '',
    reference: q.reference || q.referensi || '',
  };
}

class QuestionClient {
  async getQuestions(filters = {}) {
    const token = localStorage.getItem('auth_token');
    const queryParams = new URLSearchParams();

    if (filters.category) queryParams.append('category', filters.category);
    if (filters.subcategory) queryParams.append('subcategory', filters.subcategory);
    if (filters.difficulty) queryParams.append('difficulty', filters.difficulty);
    if (filters.type) queryParams.append('type', filters.type);
    if (filters.search) queryParams.append('search', filters.search);
    if (filters.page) queryParams.append('page', filters.page);
    if (filters.limit) queryParams.append('limit', filters.limit);

    const response = await fetch(`${API_URL}/questions?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to get questions');
    }

    const normalizedQuestions = data.data.questions.map(normalizeQuestionFromBackend);
    
    return {
      questions: normalizedQuestions,
      pagination: data.data.pagination
    };
  }

  async getQuestionFilters() {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_URL}/questions/filters`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to get question filters');
    }

    return data.data;
  }

  async getQuestionById(id) {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_URL}/questions/${id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`DEBUG: Fetch failed for ${id}. Status: ${response.status}, Body: ${errorBody}`);
      throw new Error(`Failed to get question ${id}. Status: ${response.status}`);
    }

    const data = await response.json();
    return normalizeQuestionFromBackend(data.data.question);
  }

  async createQuestion(questionData) {
    const token = localStorage.getItem('auth_token');
    const backendData = normalizeQuestionToBackend(questionData);

    const response = await fetch(`${API_URL}/questions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(backendData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to create question');
    }

    return normalizeQuestionFromBackend(data.data.question);
  }

  async updateQuestion(id, questionData) {
    const token = localStorage.getItem('auth_token');
    const backendData = normalizeQuestionToBackend(questionData);

    const response = await fetch(`${API_URL}/questions/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(backendData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to update question');
    }

    return normalizeQuestionFromBackend(data.data.question);
  }

  async deleteQuestion(id) {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_URL}/questions/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to delete question');
    }

    return data;
  }
}

export default new QuestionClient();
