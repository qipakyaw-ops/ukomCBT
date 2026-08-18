# Current Status

## Working
- Login
- CBT session
- Timer
- Autosave
- Submit
- ExamResult
- Score calculation
- questionClient → /api/questions

## Current issue
History, Performance, Dashboard tidak menampilkan submitted sessions.

## Known root cause
getSubmittedCbtSessions(userId) membutuhkan userId,
tetapi consumer memanggil tanpa userId.

## Files
- ExamHistory.jsx
- Performance.jsx
- StudentDashboard.jsx
- StatsCards.jsx
- CbtHistory.jsx
- ProgressChart.jsx
- StudyTargets.jsx
- StudySchedule.jsx

## Important architecture
Questions:
PostgreSQL → /api/questions → questionClient

Sessions:
PostgreSQL → /api/cbt-sessions → cbtSessionClient → cbtSessionStore (localStorage)

Result:
session.questionIds → API questions → correctAnswer → calculation

Note:
History/Performance/Dashboard read submitted sessions from localStorage only
(getSubmittedCbtSessions(user?.id)). No API list endpoint yet — cross-device empty.

## Planned / In Progress

### Exam Simulation
- Status: In Progress
- 180 questions
- 180-minute timer
- Random questions without duplicates
- Session type: exam
- Practice mode remains practice

### History / Performance
- Planned: distinguish Practice and Exam sessions.
- Planned: filter results by session type.
