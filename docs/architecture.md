# Architecture

## Stack

Frontend:
- React
- Vite

Backend:
- Node.js
- Express
- Prisma

Database:
- PostgreSQL

## Data flow

### Questions

PostgreSQL
→ Prisma
→ questionService
→ questionController
→ GET /api/questions
→ questionClient
→ React

### CBT Session

React
→ cbtSessionStore
→ cbtSessionClient
→ Express
→ Prisma
→ PostgreSQL

## Session identity

sessionId berasal dari URL:

/student/hasil/:sessionId

Frontend:
useParams()
→ sessionId

Tidak boleh hardcode sessionId.

## User identity

Session harus selalu scoped berdasarkan:
userId

Store functions yang membutuhkan userId harus dipanggil
dengan user.id.

Contoh:

getSubmittedCbtSessions(user?.id)

Bukan:

getSubmittedCbtSessions()

## Result

ExamResult tidak boleh menggunakan questionStore.

Result calculation menggunakan:

session.questionIds
+
API questions
+
session.answers
+
question.correctAnswer

## Local storage

cbtSessionStore menyimpan session secara lokal
dan melakukan sync ke backend.

LocalStorage dipakai untuk menjaga session tetap tersedia
di device yang sama.

Backend adalah sumber data untuk persistence lintas device.

History / Performance / Dashboard saat ini membaca submitted sessions
dari localStorage saja via getSubmittedCbtSessions(user?.id).
Belum ada fallback ke API (tidak ada GET /cbt-sessions list endpoint),
jadi riwayat lintas device kosong sampai endpoint ditambah.

## Important rule

Jangan mengubah architecture/backend jika masalah dapat
diselesaikan dengan perubahan frontend minimal.

## CBT Session Types

The system supports two CBT modes:

### Practice
- type: practice
- Used for regular practice sessions.
- Existing behavior remains unchanged.

### Exam
- type: exam
- 180 questions
- 180-minute duration
- Random questions without duplicates
- Uses the existing CBT session architecture.

Both modes share:
- answers
- bookmarks
- flags
- autosave
- timer
- submit
- result calculation

Result calculation uses the session's questionIds and answers matched against API question.correctAnswer.