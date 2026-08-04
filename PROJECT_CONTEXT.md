# CBT UKOM - Project Context

## Tujuan
Web application untuk latihan CBT UKOM keperawatan.

## Frontend
- React
- Vite
- JavaScript/JSX

## Status
Frontend CBT sudah berjalan.

Fitur yang sudah tersedia:
- Login/Register
- Student Dashboard
- Admin Dashboard
- Bank Soal
- Import CSV
- Practice
- Exam Session
- Timer
- Submit CBT
- Result
- History
- Performance
- Bookmark
- Flag question
- Autosave/resume
- Soal normal
- Soal vignette
- Image pada soal

## Data saat ini
Sebagian data masih:
- in-memory
- localStorage
- mock data

## Store penting
- src/lib/questionStore.js
- src/lib/cbtSessionStore.js

## Question model
Soal mendukung:
- id
- category
- subcategory
- difficulty
- type
- vignette
- question
- options
- image
- imageCaption
- correctAnswer
- discussion
- reference

## Target berikutnya
Migrasi bertahap dari mock/localStorage menuju:
- Backend
- PostgreSQL
- REST API
- Authentication
- Database persistence

## Aturan
- Jangan merusak fitur frontend yang sudah berjalan.
- Jangan melakukan refactor besar tanpa alasan.
- Jangan mengubah UI jika tidak diminta.
- Jangan menghapus localStorage sebelum pengganti backend terbukti bekerja.
- Migrasi dilakukan bertahap.
- Build dan lint harus dijalankan setelah perubahan.
- Gunakan Git checkpoint sebelum perubahan besar.