import { questionStore } from '@/lib/questionStore';

const STORAGE_KEY = 'nurseprep_cbt_sessions';

function hasSessionTimeRemaining(session) {
  if (!session?.startTime) return false;
  const durationSeconds = Number(session.config?.durasi ?? 0) * 60;
  const elapsedSeconds = Math.floor((Date.now() - new Date(session.startTime).getTime()) / 1000);
  return durationSeconds > elapsedSeconds;
}

function readAllStoredSessions() {
  if (typeof window === 'undefined') return [];

  try {
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '[]');
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
}

function readStoredSessions() {
  return readAllStoredSessions().filter((session) => session.status === 'in_progress' && hasSessionTimeRemaining(session));
}

function persistSessions(nextSessions) {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSessions));
  } catch {
    // Local Storage may be unavailable or full; the in-memory session remains usable.
  }
}

const BOOKMARK_STORAGE_KEY = 'student_bookmarks';

function readAllBookmarks() {
  if (typeof window === 'undefined') return {};
  try {
    const stored = JSON.parse(window.localStorage.getItem(BOOKMARK_STORAGE_KEY) ?? '{}');
    return typeof stored === 'object' && stored !== null ? stored : {};
  } catch {
    return {};
  }
}

function persistBookmarks(bookmarksByUser) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(BOOKMARK_STORAGE_KEY, JSON.stringify(bookmarksByUser));
  } catch {
    // Ignore localStorage errors.
  }
}

function getBookmarks(userId) {
  if (!userId || typeof window === 'undefined') return [];
  const allBookmarks = readAllBookmarks();
  const bookmarks = allBookmarks[userId];
  return Array.isArray(bookmarks) ? bookmarks : [];
}

function setBookmarks(userId, nextIds) {
  if (!userId || typeof window === 'undefined') return [];
  const allBookmarks = readAllBookmarks();
  const next = { ...allBookmarks, [userId]: [...new Set(nextIds)] };
  persistBookmarks(next);
  try {
    window.dispatchEvent(new CustomEvent('cbtBookmarksUpdated', { detail: { userId } }));
  } catch {
    // ignore
  }
  return next[userId];
}

export function toggleBookmark(userId, questionId) {
  if (!userId || !questionId) return [];
  const current = getBookmarks(userId);
  const nextIds = current.includes(questionId)
    ? current.filter((id) => id !== questionId)
    : [...current, questionId];
  return setBookmarks(userId, nextIds);
}

export function removeBookmark(userId, questionId) {
  if (!userId || !questionId) return [];
  const current = getBookmarks(userId);
  const nextIds = current.filter((id) => id !== questionId);
  return setBookmarks(userId, nextIds);
}

export function isBookmarked(userId, questionId) {
  if (!userId || !questionId) return false;
  return getBookmarks(userId).includes(questionId);
}

export function getBookmarksForUser(userId) {
  return getBookmarks(userId);
}

let sessions = readStoredSessions();

function matchesConfig(question, config) {
  const matchesKategori = config.kategori === 'Semua' || question.kategori === config.kategori;
  const matchesSubkategori = config.subkategori === 'Semua' || question.subkategori === config.subkategori;
  const matchesDifficulty = config.tingkatKesulitan === 'Semua' || question.tingkatKesulitan === config.tingkatKesulitan;
  return matchesKategori && matchesSubkategori && matchesDifficulty;
}

export function getAvailableQuestions(config) {
  return questionStore.getQuestions().filter((question) => matchesConfig(question, config));
}

export function createCbtSession(config) {
  const availableQuestions = getAvailableQuestions(config);

  if (availableQuestions.length < config.jumlahSoal) {
    throw new Error('Jumlah soal melebihi soal yang tersedia untuk filter yang dipilih.');
  }

  const questionIds = [...availableQuestions]
    .sort(() => Math.random() - 0.5)
    .slice(0, config.jumlahSoal)
    .map((question) => question.id);

  const session = {
    id: `session-${Date.now()}`,
    type: 'practice',
    status: 'in_progress',
    config: { ...config },
    questionIds,
    answers: {},
    flaggedQuestionIds: [],
    currentQuestionIndex: 0,
    startTime: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };

  sessions = [session, ...sessions];
  persistSessions(sessions);
  return session;
}

export function getCbtSession(sessionId) {
  return sessions.find((session) => session.id === sessionId)
    ?? readAllStoredSessions().find((session) => session.id === sessionId && session.status === 'submitted')
    ?? null;
}

export function getSubmittedCbtSessions() {
  const storedSessions = readAllStoredSessions();
  const submittedSessions = [...sessions, ...storedSessions]
    .filter((session) => session.status === 'submitted')
    .reduce((uniqueSessions, session) => {
      if (!uniqueSessions.some((item) => item.id === session.id)) uniqueSessions.push(session);
      return uniqueSessions;
    }, []);

  return submittedSessions.sort((a, b) => new Date(b.submittedAt ?? b.createdAt).getTime() - new Date(a.submittedAt ?? a.createdAt).getTime());
}

export function updateCbtSession(sessionId, updates) {
  let updatedSession = null;
  sessions = sessions.map((session) => {
    if (session.id !== sessionId) return session;
    updatedSession = { ...session, ...updates };
    return updatedSession;
  });
  if (updatedSession) persistSessions(sessions);
  // Emit a DOM event so other components can react to session updates (no new store created)
  try {
    if (typeof window !== 'undefined' && updatedSession) {
      window.dispatchEvent(new CustomEvent('cbtSessionUpdated', { detail: updatedSession }));
    }
  } catch (e) {
    // ignore
  }
  return updatedSession;
}

export function removeCbtSession(sessionId) {
  const exists = sessions.some((s) => s.id === sessionId);
  if (!exists) return false;
  sessions = sessions.filter((s) => s.id !== sessionId);
  persistSessions(sessions);
  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('cbtSessionRemoved', { detail: { id: sessionId } }));
    }
  } catch (e) {}
  return true;
}

export function getActiveCbtSession() {
  // Prefer in-memory sessions first
  const inMemory = sessions.find((s) => s.status === 'in_progress');
  if (inMemory) return inMemory;
  // Fallback to any stored in-progress session with remaining time
  const stored = readAllStoredSessions().find((s) => s.status === 'in_progress');
  if (stored) return stored;
  // If none, return the most recent submitted session
  const all = [...sessions, ...readAllStoredSessions()];
  if (all.length === 0) return null;
  return all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
}

export function submitCbtSession(sessionId, userId) {
  const session = getCbtSession(sessionId);
  if (!session || session.status !== 'in_progress') return null;

  const questionsById = new Map(questionStore.getQuestions().map((question) => [question.id, question]));
  const answers = session.answers ?? {};
  let correctCount = 0;
  let incorrectCount = 0;
  let unansweredCount = 0;

  session.questionIds.forEach((questionId) => {
    const question = questionsById.get(questionId);
    const answer = answers[questionId];

    if (!answer) {
      unansweredCount += 1;
    } else if (question && answer === question.jawabanBenar) {
      correctCount += 1;
    } else {
      incorrectCount += 1;
    }
  });

  const bookmarkCount = userId ? getBookmarksForUser(userId).length : 0;

  return updateCbtSession(sessionId, {
    status: 'submitted',
    submittedAt: new Date().toISOString(),
    result: {
      totalQuestions: session.questionIds.length,
      answeredCount: correctCount + incorrectCount,
      unansweredCount,
      correctCount,
      incorrectCount,
      bookmarkedCount: bookmarkCount,
      flaggedCount: (session.flaggedQuestionIds ?? []).length,
    },
  });
}
