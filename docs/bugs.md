# Known Bugs / Fix History

## FIXED — Result calculation

Problem:
ExamResult previously used questionStore mock.

Cause:
questionStore contained q1-q5 while database used UUID.

Fix:
ExamResult now uses questionClient.getQuestions().

Status:
FIXED

---

## FIXED — Wrong answer field

Problem:
Frontend used question.jawabanBenar.

Database/API uses:
question.correctAnswer

Fix:
Use correctAnswer consistently.

Status:
FIXED

---

## FIXED — cbtSessionClient.getQuestions

Problem:
ExamResult called:

cbtSessionClient.getQuestions()

Method does not exist.

Fix:
Use:

questionClient.getQuestions()

Status:
FIXED

---

## FIXED — Result percentage mismatch

Problem:
percentage could come from stale session.result while
correct/incorrect counts came from fresh calculation.

Fix:
calculatedResult must override session.result fields.

Status:
FIXED

---

## FIXED — Submit answers

Problem:
Submit previously sent status/result without guaranteeing
latest answers in the same PUT.

Fix:
submitCbtSession sends:

status
submittedAt
answers
result

in submit request.

Status:
FIXED

---

## CURRENT — History / Performance / Dashboard

Problem:
Submitted sessions are not displayed correctly.

Root cause:
getSubmittedCbtSessions(userId) requires userId,
but some consumers called it without userId.

Affected:
- ExamHistory
- Performance
- StudentDashboard
- StatsCards
- CbtHistory
- ProgressChart
- StudyTargets
- StudySchedule

Expected:

getSubmittedCbtSessions(user?.id)

Status:
TO FIX / VERIFY

---

## Rules

When fixing a bug:

1. Find first failure point.
2. Verify actual source.
3. Make minimal change.
4. Do not reintroduce mock questionStore.
5. Do not hardcode sessionId.
6. Verify affected flow after change.