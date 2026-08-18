import { questionStore } from '@/lib/questionStore';
import cbtSessionClient from '@/api/cbtSessionClient.js';
import questionClient from '@/api/questionClient.js';
import { getBookmarkIds } from '@/lib/bookmarkStore';

const STORAGE_KEY = 'nurseprep_cbt_sessions';

function hasSessionTimeRemaining(session) {
  if (!session?.startTime) return false;
  const durationSeconds = Number(session.config?.durasi ?? 0) * 60;
  const elapsedSeconds = Math.floor((Date.now() - new Date(session.startTime).getTime()) / 1000);
  return durationSeconds > elapsedSeconds;
}

function readAllStoredSessions() {
  if (typeof window === 'undefined') return {};
  try {
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '{}');
    return typeof stored === 'object' && stored !== null ? stored : {};
  } catch { return {}; }
}

function readStoredSessions(userId) {
  if (!userId) return [];
  return (readAllStoredSessions()[userId] ?? []).filter((session) => session.status === 'in_progress' && hasSessionTimeRemaining(session));
}

function persistSessions(userId, nextSessions) {
  if (typeof window === 'undefined' || !userId) return;
  try {
    const all = readAllStoredSessions();
    all[userId] = nextSessions;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {}
}

export function getActiveCbtSession(userId, sessionType = 'practice') {
  if (!userId) return null;
  const sessions = readStoredSessions(userId);
  // ponytail: legacy sessions without type default to 'practice', do not mutate stored data
  return sessions.find((s) => (s.type ?? 'practice') === sessionType) ?? null;
}

export function getCbtSession(sessionId, userId) {
  if (!userId) return null;
  const allSessions = readAllStoredSessions()[userId] ?? [];
  return allSessions.find(s => s.id === sessionId) ?? null;
}

export async function getSubmittedCbtSessions(userId) {
  if (!userId) return [];
  try {
    const result = await cbtSessionClient.getSubmittedSessions();
    // ponytail: always return array, guard against non-array API responses
    return Array.isArray(result) ? result : Array.isArray(result?.data) ? result.data : [];
  } catch (error) {
    console.error('[CBT] Failed to fetch submitted sessions from backend:', error);
    // Fallback: read submitted sessions from localStorage (legacy fallback)
    const storedSessions = readAllStoredSessions()[userId] ?? [];
    return storedSessions
      .filter((session) => session.status === 'submitted')
      .sort((a, b) => new Date(b.submittedAt ?? b.createdAt).getTime() - new Date(a.submittedAt ?? a.createdAt).getTime());
  }
}

export async function createCbtSessionWithQuestions(userId, config, questions, sessionType = 'practice') {
  if (!userId || !Array.isArray(questions)) throw new Error('Data tidak valid.');
  const questionIds = [...questions].sort(() => Math.random() - 0.5).slice(0, config.jumlahSoal).map(q => q.id);
  const session = {
    id: `session-${Date.now()}`,
    userId,
    type: sessionType,
    status: 'in_progress',
    config: { ...config },
    questionIds,
    answers: {},
    currentQuestionIndex: 0,
    startTime: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };
  try {
    const backendSession = await cbtSessionClient.createSession(session);
    const sessions = readAllStoredSessions()[userId] ?? [];
    persistSessions(userId, [backendSession, ...sessions]);
    return backendSession;
  } catch {
    const sessions = readAllStoredSessions()[userId] ?? [];
    persistSessions(userId, [session, ...sessions]);
    return session;
  }
}

export async function updateCbtSession(sessionId, userId, updates) {
  if (!userId) return null;
  const all = readAllStoredSessions();
  const sessions = (all[userId] ?? []).map(s => s.id === sessionId ? { ...s, ...updates } : s);
  persistSessions(userId, sessions);
  try {
    await cbtSessionClient.updateSession(sessionId, updates);
  } catch (error) {
    console.error('[CBT SYNC] Failed to sync session:', error);
  }
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('cbtSessionUpdated', { detail: sessions.find(s => s.id === sessionId) }));
  return sessions.find(s => s.id === sessionId);
}

export function removeCbtSession(sessionId, userId) {
  if (!userId) return false;
  persistSessions(userId, (readAllStoredSessions()[userId] ?? []).filter(s => s.id !== sessionId));
  return true;
}

export async function submitCbtSession(sessionId, userId) {
  const session = getCbtSession(sessionId, userId);
  if (!session || session.status !== 'in_progress') return null;

  // ponytail: score against API/DB-backed questions that the session was built from, not the local seed store
  let questionsById = new Map();
  try {
    const { questions } = await questionClient.getQuestions({ limit: 1000 });
    questionsById = new Map(questions.map((question) => [question.id, question]));
  } catch (error) {
    console.error('[CBT] Failed to load questions for scoring, falling back to local store:', error);
    questionsById = new Map(questionStore.getQuestions().map((question) => [question.id, question]));
  }
  const answers = session.answers ?? {};
  let correctCount = 0;
  let incorrectCount = 0;
  let unansweredCount = 0;

  session.questionIds.forEach((questionId) => {
    const question = questionsById.get(questionId);
    const answer = answers[questionId];
    if (!answer) unansweredCount += 1;
    else if (question && answer === question.jawabanBenar) correctCount += 1;
    else incorrectCount += 1;
  });

  const bookmarkCount = userId ? getBookmarkIds(userId).length : 0;
  // ponytail: satu PUT submit membawa answers terbaru + status + submittedAt
  const updated = await updateCbtSession(sessionId, userId, {
    status: 'submitted',
    submittedAt: new Date().toISOString(),
    answers: session.answers ?? {},
    result: {
      totalQuestions: session.questionIds.length,
      answeredCount: correctCount + incorrectCount,
      unansweredCount, correctCount, incorrectCount,
      bookmarkedCount: bookmarkCount,
      flaggedCount: (session.flaggedQuestionIds ?? []).length,
    },
  });
  // ponytail: submitted sessions no longer kept in localStorage — moved to backend
  removeCbtSession(sessionId, userId);
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('cbtSessionsRefreshed'));
  return updated;
}

