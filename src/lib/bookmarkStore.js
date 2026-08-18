import cbtBookmarkClient from '@/api/cbtBookmarkClient.js';

// In-memory cache keyed by userId -> Set of questionIds.
// PostgreSQL (cbt_bookmarks) is the source of truth; this cache exists only to
// keep reads synchronous for optimistic UI and to avoid redundant fetches.
const cacheByUser = new Map();

function getSet(userId) {
  if (!cacheByUser.has(userId)) cacheByUser.set(userId, new Set());
  return cacheByUser.get(userId);
}

function notify(userId) {
  try {
    window.dispatchEvent(new CustomEvent('cbtBookmarksUpdated', { detail: { userId } }));
  } catch {}
}

// Load bookmarks from the backend into the in-memory cache.
export async function loadBookmarks(userId) {
  if (!userId) return [];
  try {
    const ids = await cbtBookmarkClient.getBookmarks();
    const set = new Set(Array.isArray(ids) ? ids : []);
    cacheByUser.set(userId, set);
    return [...set];
  } catch (error) {
    console.error('[BookmarkStore] Failed to load bookmarks:', error);
    return [...getSet(userId)];
  }
}

// Synchronous read of cached bookmark ids (empty until loadBookmarks resolves).
export function getBookmarkIds(userId) {
  if (!userId) return [];
  return [...getSet(userId)];
}

// Add a bookmark: optimistic cache update + POST to backend.
export async function addBookmark(userId, questionId) {
  if (!userId || !questionId) return getBookmarkIds(userId);
  const set = getSet(userId);
  set.add(questionId);
  notify(userId);
  try {
    await cbtBookmarkClient.addBookmark(questionId);
  } catch (error) {
    console.error('[BookmarkStore] Failed to add bookmark:', error);
    // Roll back optimistic update on failure so UI reflects server truth.
    set.delete(questionId);
    notify(userId);
  }
  return [...set];
}

// Remove a bookmark: optimistic cache update + DELETE to backend.
export async function removeBookmark(userId, questionId) {
  if (!userId || !questionId) return getBookmarkIds(userId);
  const set = getSet(userId);
  const had = set.delete(questionId);
  notify(userId);
  try {
    await cbtBookmarkClient.removeBookmark(questionId);
  } catch (error) {
    console.error('[BookmarkStore] Failed to remove bookmark:', error);
    // Restore on failure so UI reflects server truth.
    if (had) set.add(questionId);
    notify(userId);
  }
  return [...set];
}

// Toggle: if present remove, else add. Returns the updated ids.
export async function toggleBookmark(userId, questionId) {
  const set = getSet(userId);
  return set.has(questionId)
    ? removeBookmark(userId, questionId)
    : addBookmark(userId, questionId);
}
