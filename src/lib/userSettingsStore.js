import userSettingsClient from '@/api/userSettingsClient.js';

// In-memory cache of the current user's targets. Single source of truth is
// user_settings (PostgreSQL). Used by StudyTargets and StatsCards so both
// display the same sessionGoal/scoreGoal.
const DEFAULT_TARGETS = { sessionGoal: 8, scoreGoal: 85 };

let cache = null;
let loadPromise = null;

export function getTargets() {
  return cache ?? { ...DEFAULT_TARGETS };
}

export function notifyTargetsChanged() {
  try {
    window.dispatchEvent(new CustomEvent('userSettingsUpdated'));
  } catch {}
}

// Load the user's targets from backend. Returns defaults on error so the UI
// never blanks.
export async function loadTargets(userId) {
  if (!userId) return { ...DEFAULT_TARGETS };
  loadPromise = userSettingsClient.getSettings()
    .then((settings) => {
      cache = {
        sessionGoal: Number.isInteger(settings.sessionGoal) ? settings.sessionGoal : DEFAULT_TARGETS.sessionGoal,
        scoreGoal: Number.isInteger(settings.scoreGoal) ? settings.scoreGoal : DEFAULT_TARGETS.scoreGoal,
      };
      return { ...cache };
    })
    .catch((error) => {
      console.error('[UserSettings] Failed to load targets:', error);
      return { ...DEFAULT_TARGETS };
    });
  return loadPromise;
}

export async function saveTargets(userId, sessionGoal, scoreGoal) {
  if (!userId) return { ...DEFAULT_TARGETS };
  const settings = await userSettingsClient.updateSettings(sessionGoal, scoreGoal);
  cache = {
    sessionGoal: Number.isInteger(settings.sessionGoal) ? settings.sessionGoal : sessionGoal,
    scoreGoal: Number.isInteger(settings.scoreGoal) ? settings.scoreGoal : scoreGoal,
  };
  notifyTargetsChanged();
  return { ...cache };
}
