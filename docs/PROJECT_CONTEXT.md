# NursePrep CBT UKOM — Project Context

## Goal

Web CBT UKOM untuk latihan ujian perawat.

## Stack

Frontend:
React + Vite

Backend:
Node.js + Express

ORM:
Prisma

Database:
PostgreSQL

## Core architecture

Questions:

PostgreSQL
→ /api/questions
→ questionClient
→ React

Sessions:

React
→ cbtSessionStore
→ cbtSessionClient
→ backend
→ PostgreSQL

## Question model

Important fields:

id
category
subcategory
difficulty
type
vignette
question
options
correctAnswer

Question IDs are UUID.

## Session

Session contains:

id
userId
questionIds
answers
status
startTime
submittedAt
result (client-calculated, NOT persisted to DB)

## Result calculation

ExamResult gets:

sessionId from URL
→ get session
→ get questions from questionClient
→ match session.questionIds with question.id
→ compare session.answers[id] with question.correctAnswer

Never use questionStore for production result calculation.

## User scoping

Session data belongs to userId.

Store functions requiring userId must receive:

user?.id

Example:

getSubmittedCbtSessions(user?.id)

## Current status

Working:
- Login
- CBT session
- Question answering
- Timer
- Autosave
- Bookmark
- Flag
- Submit
- Result calculation
- Correct/incorrect/blank calculation

Current work:
History
Performance
Dashboard

## Development rules

- Prefer minimal changes.
- Do not hardcode IDs.
- Do not use mock data for production data.
- Do not change database schema unless necessary.
- Do not reread unrelated files.
- Verify root cause before editing.
- After editing, run relevant validation only.
- Keep responses concise.

## Exam Simulation

## Exam Simulation

Planned feature:
- Mode: exam
- 180 multiple-choice questions
- Duration: 180 minutes
- Random questions
- No duplicate questions
- Reuse existing CBT flow: answer, bookmark, flag, autosave, timer, submit, result
- Practice mode remains unchanged
- Session type:
  - practice = Latihan
  - exam = Ujian

Result, History, and Performance must calculate from:
session.questionIds + session.answers + API questions.correctAnswer.