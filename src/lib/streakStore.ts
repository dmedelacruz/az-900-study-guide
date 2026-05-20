// src/lib/streakStore.ts — Study streak data layer for the AZ-900 study guide

const STORAGE_KEY = 'az900-streak-data';

interface StreakStore {
  lastActivityDate: string | null; // "YYYY-MM-DD" in local time
  currentStreak: number;
  longestStreak: number;
}

const INITIAL_STATE: StreakStore = {
  lastActivityDate: null,
  currentStreak: 0,
  longestStreak: 0,
};

// Module-level guard so initStreakListener() is idempotent
let listenerAttached = false;

// ---------------------------------------------------------------------------
// Date helpers (module-private)
// ---------------------------------------------------------------------------

function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function isYesterday(dateStr: string): boolean {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return dateStr === toDateString(yesterday);
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function loadStore(): StreakStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as unknown;
      if (
        parsed !== null &&
        typeof parsed === 'object' &&
        'lastActivityDate' in parsed &&
        'currentStreak' in parsed &&
        'longestStreak' in parsed
      ) {
        return parsed as StreakStore;
      }
    }
  } catch {
    // localStorage unavailable (private browsing) or corrupted data — start fresh
  }
  return { ...INITIAL_STATE };
}

function saveStore(store: StreakStore): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // localStorage unavailable — silently ignore
  }
}

function dispatchStreakEvent(currentStreak: number, longestStreak: number): void {
  try {
    document.dispatchEvent(
      new CustomEvent('streak:updated', {
        detail: { currentStreak, longestStreak, isNewDay: true },
      })
    );
  } catch {
    // document may not be available in SSR/test contexts — silently ignore
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Records study activity for today.
 * Returns streak state if this is the first activity of the day, or null if
 * activity was already recorded today.
 */
export function recordStudyActivity(): { currentStreak: number; longestStreak: number; isNewDay: true } | null {
  const today = toDateString(new Date());
  const store = loadStore();

  if (store.lastActivityDate === today) return null;

  if (isYesterday(store.lastActivityDate ?? '')) {
    store.currentStreak += 1;
  } else {
    store.currentStreak = 1;
  }

  store.longestStreak = Math.max(store.longestStreak, store.currentStreak);
  store.lastActivityDate = today;

  saveStore(store);
  dispatchStreakEvent(store.currentStreak, store.longestStreak);

  return { currentStreak: store.currentStreak, longestStreak: store.longestStreak, isNewDay: true };
}

/**
 * Returns the current streak state. If the last activity was 2+ days ago,
 * returns currentStreak of 0 without modifying stored data.
 */
export function getStreak(): { currentStreak: number; longestStreak: number; lastActivityDate: string | null } {
  const store = loadStore();

  const today = toDateString(new Date());
  const isActive =
    store.lastActivityDate === today || isYesterday(store.lastActivityDate ?? '');

  return {
    currentStreak: isActive ? store.currentStreak : 0,
    longestStreak: store.longestStreak,
    lastActivityDate: store.lastActivityDate,
  };
}

/**
 * Attaches an `xp:earned` event listener that records study activity.
 * Idempotent — safe to call multiple times; only registers the listener once.
 */
export function initStreakListener(): void {
  if (listenerAttached) return;
  listenerAttached = true;

  try {
    document.addEventListener('xp:earned', () => {
      recordStudyActivity();
    });
  } catch {
    // document may not be available in SSR/test contexts — silently ignore
  }
}

/**
 * Clears all streak data from localStorage. Intended for testing and debug use only.
 */
export function resetStreak(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // localStorage unavailable — silently ignore
  }
}
