# API Reference

Base URL:
http://localhost:3001/api

## Auth

POST /auth/login
POST /auth/register

Auth menggunakan user/session authentication.

## Questions

GET /questions

Frontend client:
src/api/questionClient.js

Response question:
{
  id,
  category,
  subcategory,
  difficulty,
  type,
  vignette,
  question,
  options,
  correctAnswer,
  createdAt,
  updatedAt
}

IMPORTANT:
- ID question berasal dari PostgreSQL UUID.
- correct answer field = correctAnswer.
- Jangan gunakan jawabanBenar.
- Jangan gunakan questionStore mock untuk production/result calculation.

## CBT Sessions

POST /cbt-sessions
PUT /cbt-sessions/:id
GET /cbt-sessions/:id

Frontend client:
src/api/cbtSessionClient.js

Session fields:
- id
- userId
- questionIds
- answers
- status
- startTime
- submittedAt
- result (client-calculated; controller strips it from PUT — NOT persisted to DB)

Session ownership harus berdasarkan userId.

## List sessions (MISSING ENDPOINT)

GET /cbt-sessions  (not yet implemented)

Backend already has cbtSessionService.getSessionsByUser(userId) but no route exposes it.
History/Performance/Dashboard currently read submitted sessions from localStorage only
via getSubmittedCbtSessions(user?.id) — no API fallback, so cross-device history is empty
until this endpoint is added.

## Result calculation

ExamResult:
session.questionIds
→ questionClient.getQuestions()
→ match question.id
→ compare answers[id] dengan question.correctAnswer

Jangan hardcode sessionId.