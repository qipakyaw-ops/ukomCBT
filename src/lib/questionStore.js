// Shared in-memory store for Bank Soal questions + import history.
// Keeps Bank Soal and Import CSV in sync without a backend.

function normalizeOptions(raw) {
  const optionIds = ['A', 'B', 'C', 'D', 'E'];

  if (Array.isArray(raw.options) && raw.options.length) {
    return raw.options
      .filter((option) => option && typeof option === 'object')
      .map((option) => ({
        id: String(option.id ?? '').trim() || '',
        text: String(option.text ?? option.value ?? '').trim(),
      }))
      .filter((option) => option.id && option.text);
  }

  if (typeof raw.options === 'string' && raw.options.trim()) {
    const value = raw.options.trim();
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed
          .filter((option) => option && typeof option === 'object')
          .map((option) => ({ id: String(option.id ?? '').trim(), text: String(option.text ?? option.value ?? '').trim() }))
          .filter((option) => option.id && option.text);
      }
    } catch {
      // ignore and fall back to delimiter parsing
    }

    return value
      .split(/[|;]/)
      .map((entry) => entry.trim())
      .filter(Boolean)
      .map((entry) => {
        const separatorIndex = entry.indexOf(':');
        if (separatorIndex < 0) return null;
        const id = entry.slice(0, separatorIndex).trim().toUpperCase();
        const text = entry.slice(separatorIndex + 1).trim();
        return id && text ? { id, text } : null;
      })
      .filter(Boolean);
  }

  const legacyOptionMap = raw.pilihan ?? {
    A: raw.optionA ?? raw.option_a ?? '',
    B: raw.optionB ?? raw.option_b ?? '',
    C: raw.optionC ?? raw.option_c ?? '',
    D: raw.optionD ?? raw.option_d ?? '',
    E: raw.optionE ?? raw.option_e ?? '',
  };

  return optionIds
    .map((id) => ({
      id,
      text: String(legacyOptionMap[id] ?? '').trim(),
    }))
    .filter((option) => option.text);
}

function normalizeQuestion(question) {
  const raw = question ?? {};
  const options = normalizeOptions(raw);
  const category = raw.category ?? raw.kategori ?? '';
  const subcategory = raw.subcategory ?? raw.subkategori ?? '';
  const difficulty = raw.difficulty ?? raw.tingkatKesulitan ?? '';
  const questionText = raw.question ?? raw.pertanyaan ?? '';
  const vignette = String(raw.vignette ?? raw.case ?? '').trim();
  const image = String(raw.image ?? raw.img ?? '').trim();
  const imageCaption = String(raw.imageCaption ?? raw.image_caption ?? raw.imageCaption ?? raw.caption ?? '').trim();
  const correctAnswer = String(raw.correctAnswer ?? raw.correct_answer ?? raw.jawabanBenar ?? '').trim().toUpperCase();
  const discussion = raw.discussion ?? raw.pembahasan ?? '';
  const reference = raw.reference ?? raw.referensi ?? '';
  const type = String(raw.type ?? raw.questionType ?? (vignette ? 'vignette' : 'normal')).trim().toLowerCase() || (vignette ? 'vignette' : 'normal');
  const createdAt = raw.createdAt ?? raw.created_at ?? new Date().toISOString();
  const updatedAt = raw.updatedAt ?? raw.updated_at ?? createdAt;

  const optionMap = Object.fromEntries(options.map((option) => [option.id, option.text]));

  return {
    ...raw,
    id: raw.id ?? '',
    category,
    subcategory,
    difficulty,
    type,
    vignette,
    question: questionText,
    image,
    imageCaption,
    options,
    correctAnswer,
    discussion,
    reference,
    createdAt,
    updatedAt,
    questionType: type,
    kategori: category,
    subkategori: subcategory,
    pertanyaan: questionText,
    pilihan: {
      A: optionMap.A ?? '',
      B: optionMap.B ?? '',
      C: optionMap.C ?? '',
      D: optionMap.D ?? '',
      E: optionMap.E ?? '',
    },
    jawabanBenar: correctAnswer,
    pembahasan: discussion,
    referensi: reference,
    tingkatKesulitan: difficulty,
  };
}

const seed = [
  { id: 'q1', kategori: 'Medikal Bedah', subkategori: 'Kardiovaskular', pertanyaan: 'Manuver pertama pada luka bakar derajat II adalah?', pilihan: { A: 'Berikan antibiotik', B: 'Irigasi dengan air mengalir', C: 'Oleskan mentega', D: 'Tutup dengan kasa ketat', E: 'Kompres es' }, jawabanBenar: 'B', pembahasan: 'Irigasi air mengalir menurunkan suhu dan membersihkan kontaminan.', referensi: 'Potter & Perry, hlm. 240', tingkatKesulitan: 'Sedang', tag: ['darurat', 'luka bakar'] },
  { id: 'q2', kategori: 'Farmakologi', subkategori: 'Obat Kardiovaskular', pertanyaan: 'Efek samping utama digoksin pada lansia?', pilihan: { A: 'Hipotensi', B: 'Bradiaritmia & gangguan visual', C: 'Hipertensi', D: 'Diare', E: 'Insomnia' }, jawabanBenar: 'B', pembahasan: 'Toksitas digoksin: bradiaritmia, kuning-hijau pada penglihatan.', referensi: 'Katzung, hlm. 510', tingkatKesulitan: 'Sulit', tag: ['digoksin', 'lansia'] },
  { id: 'q3', kategori: 'Maternitas', subkategori: 'Kehamilan', pertanyaan: 'Tanda bahaya kehamilan trimester III meliputi?', pilihan: { A: 'Mual pagi', B: 'Perdarahan pervaginam', C: 'Nafsu makan meningkat', D: 'Kram ringan', E: 'Pigmentasi' }, jawabanBenar: 'B', pembahasan: 'Perdarahan dapat mengindikasikan solusio plasenta/plasenta previa.', referensi: 'Varney, hlm. 380', tingkatKesulitan: 'Mudah', tag: ['kehamilan', 'darurat obstetri'] },
  { id: 'q4', kategori: 'Keperawatan Anak', subkategori: 'Nutrisi', pertanyaan: 'Indikasi pemberian ASI eksklusif selama?', pilihan: { A: '0-2 bulan', B: '0-4 bulan', C: '0-6 bulan', D: '0-12 bulan', E: '0-24 bulan' }, jawabanBenar: 'C', pembahasan: 'ASI eksklusif direkomendasikan 0-6 bulan tanpa makanan tambahan.', referensi: 'WHO/IDAI, 2020', tingkatKesulitan: 'Mudah', tag: ['ASI', 'bayi'] },
  { id: 'q5', kategori: 'Keperawatan Jiwa', subkategori: 'Gangguan Suasana Hatu', pertanyaan: 'Gejala utama episode depresi berat adalah?', pilihan: { A: 'Euforia', B: 'Anhedonia & suasana hati tertekan', C: 'Halusinasi visual', D: 'Pikir terbang', E: 'Pembicaraan cepat' }, jawabanBenar: 'B', pembahasan: 'Anhedonia dan suasana hati tertekan >= 2 minggu.', referensi: 'PPDGJ III', tingkatKesulitan: 'Sedang', tag: ['depresi', 'jiwa'] },
];

let questions = seed.map((q) => normalizeQuestion(q));
let history = [];
const listeners = new Set();

export const questionStore = {
  getQuestions: () => questions,
  getHistory: () => history,
  subscribe(fn) {
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  },
  _emit() { listeners.forEach((fn) => fn()); },

  addQuestion(data) {
    const q = normalizeQuestion({ ...data, id: `q${Date.now()}` });
    questions = [q, ...questions];
    this._emit();
    return q;
  },
  addQuestions(list) {
    const now = Date.now();
    const added = list.map((d, i) => normalizeQuestion({ ...d, id: `q${now}_${i}` }));
    questions = [...added, ...questions];
    this._emit();
    return added;
  },
  updateQuestion(id, data) {
    questions = questions.map((q) => (q.id === id ? normalizeQuestion({ ...q, ...data }) : q));
    this._emit();
  },
  deleteQuestion(id) {
    questions = questions.filter((q) => q.id !== id);
    this._emit();
  },
  mergeQuestions(list) {
    const next = new Map(questions.map((q) => [q.id, q]));
    list.forEach((item) => {
      const normalized = normalizeQuestion(item);
      if (!normalized.id) return;
      next.set(normalized.id, normalized);
    });
    questions = [...next.values()];
    this._emit();
    return questions;
  },
  addHistory(entry) {
    history = [entry, ...history];
    this._emit();
  },
  rollback(historyId) {
    const entry = history.find((h) => h.id === historyId);
    if (!entry || entry.rolledBack) return;
    const ids = new Set(entry.questionIds);
    questions = questions.filter((q) => !ids.has(q.id));
    history = history.map((h) => (h.id === historyId ? { ...h, rolledBack: true } : h));
    this._emit();
  },
};