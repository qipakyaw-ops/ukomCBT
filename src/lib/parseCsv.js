// Minimal CSV parser supporting quoted fields, embedded commas, and escaped quotes.

export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(field); field = '';
    } else if (c === '\n') {
      row.push(field); rows.push(row); row = []; field = '';
    } else if (c !== '\r') {
      field += c;
    }
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
}

export const REQUIRED_COLUMNS = [
  'kategori', 'subkategori', 'pertanyaan', 'pilihan_a', 'pilihan_b', 'pilihan_c',
  'pilihan_d', 'pilihan_e', 'jawaban', 'pembahasan', 'referensi', 'tingkat_kesulitan', 'tag',
];

export const OPTIONAL_COLUMNS = ['vignette', 'type', 'image', 'image_caption', 'options'];

export function csvToRows(text) {
  const data = parseCsv(text.trim());
  if (data.length < 2) return { headers: [], rows: [], error: 'File kosong atau tidak memiliki baris data.' };
  const headers = data[0].map((h) => h.trim().toLowerCase());
  const missing = REQUIRED_COLUMNS.filter((c) => !headers.includes(c));
  if (missing.length) return { headers, rows: [], error: `Kolom wajib hilang: ${missing.join(', ')}.` };

  const rows = data.slice(1)
    .filter((r) => r.some((c) => c.trim() !== ''))
    .map((r) => {
      const obj = {};
      headers.forEach((h, i) => { obj[h] = (r[i] ?? '').trim(); });
      return obj;
    });
  return { headers, rows, error: null };
}

export const TEMPLATE_HEADERS = [...REQUIRED_COLUMNS, ...OPTIONAL_COLUMNS].join(',');
export const TEMPLATE_EXAMPLE =
  'Medikal Bedah,Kardiovaskular,"Manuver pertama pada luka bakar derajat II adalah?","Berikan antibiotik","Irigasi dengan air mengalir","Oleskan mentega","Tutup dengan kasa ketat","Kompres es",B,"Irigasi air mengalir menurunkan suhu dan membersihkan kontaminan.","Potter & Perry, hlm. 240",Sedang,"darurat;luka bakar","Pasien datang dengan luka bakar derajat II yang memerlukan penanganan segera"';

export function downloadTemplate() {
  const blob = new Blob([TEMPLATE_HEADERS + '\n' + TEMPLATE_EXAMPLE + '\n'], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'template_soal_nurseprep.csv';
  a.click();
  URL.revokeObjectURL(url);
}