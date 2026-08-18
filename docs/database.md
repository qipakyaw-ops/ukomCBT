# Database

Database:
PostgreSQL

ORM:
Prisma

## Main tables

### users

User/account data.

Important:
- id
- role

### questions

Question bank.

Fields:

id
category
subcategory
difficulty
type
vignette
question
options
correctAnswer
createdAt
updatedAt

IMPORTANT:
correct answer field is:

correctAnswer

NOT:
jawabanBenar

Question ID:
UUID

### cbt_sessions

CBT session.

Important fields:

id
userId
questionIds
answers
status
startTime
submittedAt
result (NOT a column — calculated client-side from answers + correctAnswer)

Session belongs to user through:

cbt_sessions.userId → users.id

## Session status

Known statuses:

in_progress
submitted
expired

Expired-then-submitted sessions: getSubmittedCbtSessions filters status === 'submitted' only,
so sessions left in 'expired' are excluded from History/Performance/Dashboard.

## Important

Do not assume question IDs such as:
q1
q2
q3

Production question IDs are PostgreSQL UUIDs.

Example:

916fa627-9b8f-43cd-8587-62472c48e5df

## Result

Current result calculation is performed by frontend
from session.answers + questions.correctAnswer.

Do not introduce a new database result column unless
explicitly requested.