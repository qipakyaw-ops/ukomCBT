const VALID_JAWABAN = ['A', 'B', 'C', 'D', 'E'];
const VALID_KESULITAN = ['Mudah', 'Sedang', 'Sulit'];

function parseOptions(row) {
  const optionIds = ['A', 'B', 'C', 'D', 'E'];
  const optionsValue = (row.options || row.option_set || '').trim();

  if (optionsValue) {
    try {
      const parsed = JSON.parse(optionsValue);
      if (Array.isArray(parsed)) {
        return parsed
          .filter((option) => option && typeof option === 'object')
          .map((option) => ({ id: String(option.id ?? '').trim(), text: String(option.text ?? option.value ?? '').trim() }))
          .filter((option) => option.id && option.text);
      }
    } catch {
      // ignore
    }

    return optionsValue
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

  const legacyOptionMap = {
    A: (row.option_a || row.optionA || row.pilihan_a || '').trim(),
    B: (row.option_b || row.optionB || row.pilihan_b || '').trim(),
    C: (row.option_c || row.optionC || row.pilihan_c || '').trim(),
    D: (row.option_d || row.optionD || row.pilihan_d || '').trim(),
    E: (row.option_e || row.optionE || row.pilihan_e || '').trim(),
  };

  return optionIds
    .map((id) => ({ id, text: legacyOptionMap[id] }))
    .filter((option) => option.text);
}

export function rowToQuestion(row) {
  const category = (row.category || row.kategori || '').trim();
  const subcategory = (row.subcategory || row.subkategori || '').trim();
  const questionText = (row.question || row.pertanyaan || '').trim();
  const vignette = (row.vignette || '').trim();
  const options = parseOptions(row);
  const correctAnswer = (row.correct_answer || row.correctAnswer || row.jawaban || '').trim().toUpperCase();
  const discussion = (row.discussion || row.pembahasan || '').trim();
  const reference = (row.reference || row.referensi || '').trim();
  const difficulty = (row.difficulty || row.tingkat_kesulitan || '').trim();
  const type = (row.type || row.question_type || row.questionType || '').trim().toLowerCase() || (vignette ? 'vignette' : 'normal');
  const image = (row.image || row.image_url || row.imageUrl || '').trim();
  const imageCaption = (row.image_caption || row.imageCaption || row.imagecaption || '').trim();

  return {
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
    kategori: category,
    subkategori: subcategory,
    pertanyaan: questionText,
    pilihan: Object.fromEntries(options.map((option) => [option.id, option.text])),
    jawabanBenar: correctAnswer,
    pembahasan: discussion,
    referensi: reference,
    tingkatKesulitan: difficulty,
    tag: (row.tag || '').split(';').map((t) => t.trim()).filter(Boolean),
  };
}

export function validateQuestion(q, existingSet, seenSet) {
  const errors = [];
  const questionText = (q.question || q.pertanyaan || '').trim();
  const options = Array.isArray(q.options) && q.options.length
    ? q.options.map((option) => ({ id: String(option.id ?? '').trim(), text: String(option.text ?? '').trim() }))
    : q.pilihan
      ? ['A', 'B', 'C', 'D', 'E'].map((id) => ({ id, text: String(q.pilihan[id] ?? '').trim() }))
      : ['A', 'B', 'C', 'D', 'E'].map((id) => ({ id, text: String(q[`option${id}`] ?? '').trim() }));
  const correctAnswer = String(q.correctAnswer || q.correct_answer || q.jawabanBenar || '').trim().toUpperCase();
  const difficulty = q.difficulty || q.tingkatKesulitan || '';

  if (!q.kategori && !q.category) errors.push('Kategori kosong');
  if (!q.subkategori && !q.subcategory) errors.push('Subkategori kosong');
  if (!questionText) errors.push('Pertanyaan kosong');
  options.forEach((option) => {
    if (!option.text) errors.push(`Pilihan ${option.id} kosong`);
  });
  if (!VALID_JAWABAN.includes(correctAnswer)) errors.push('Jawaban harus A/B/C/D/E');
  if (difficulty && !VALID_KESULITAN.includes(difficulty)) errors.push('Tingkat kesulitan tidak valid');
  if (!difficulty) errors.push('Tingkat kesulitan kosong');

  let duplicate = false;
  if (questionText) {
    const key = questionText.toLowerCase();
    if (existingSet.has(key) || seenSet.has(key)) duplicate = true;
  }
  return { errors, duplicate };
}