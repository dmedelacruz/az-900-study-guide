// src/lib/xpStore.ts — XP data layer for the AZ-900 study guide

const STORAGE_KEY = 'az900-xp-data';

const XP_VALUES = {
  reading: 10,
  quiz: 25,
  quizPerfectBonus: 50,
} as const;

export interface XPEntry {
  type: 'reading' | 'quiz' | 'quiz-perfect';
  sectionId: string;
  points: number;
  timestamp: number;
}

interface XPStore {
  entries: XPEntry[];
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function loadStore(): XPStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as unknown;
      if (
        parsed !== null &&
        typeof parsed === 'object' &&
        'entries' in parsed &&
        Array.isArray((parsed as XPStore).entries)
      ) {
        return parsed as XPStore;
      }
    }
  } catch {
    // localStorage unavailable (private browsing) or corrupted data — start fresh
  }
  return { entries: [] };
}

function saveStore(store: XPStore): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // localStorage unavailable — silently ignore
  }
}

function dispatchXPEvent(points: number, type: XPEntry['type'], sectionId: string, total: number): void {
  try {
    document.dispatchEvent(
      new CustomEvent('xp:earned', {
        detail: { points, type, sectionId, total },
      })
    );
  } catch {
    // document may not be available in SSR/test contexts — silently ignore
  }
}

function sumEntries(entries: XPEntry[]): number {
  return entries.reduce((acc, entry) => acc + entry.points, 0);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Awards +10 XP for reading a section.
 * Deduplicates by sectionId — returns XP earned, or null if already awarded.
 */
export function awardReadingXP(sectionId: string): number | null {
  const store = loadStore();

  const alreadyAwarded = store.entries.some(
    (e) => e.sectionId === sectionId && e.type === 'reading'
  );
  if (alreadyAwarded) return null;

  const points = XP_VALUES.reading;
  const entry: XPEntry = {
    type: 'reading',
    sectionId,
    points,
    timestamp: Date.now(),
  };

  store.entries.push(entry);
  saveStore(store);

  const total = sumEntries(store.entries);
  dispatchXPEvent(points, 'reading', sectionId, total);

  return points;
}

/**
 * Awards +25 XP for completing a quiz, or +75 XP if isPerfect is true
 * (+25 base + +50 perfect bonus).
 * Deduplicates by sectionId — returns XP earned, or null if already awarded.
 */
export function awardQuizXP(sectionId: string, isPerfect: boolean): number | null {
  const store = loadStore();

  const alreadyAwarded = store.entries.some(
    (e) => e.sectionId === sectionId && (e.type === 'quiz' || e.type === 'quiz-perfect')
  );
  if (alreadyAwarded) return null;

  const points = isPerfect
    ? XP_VALUES.quiz + XP_VALUES.quizPerfectBonus
    : XP_VALUES.quiz;
  const type: XPEntry['type'] = isPerfect ? 'quiz-perfect' : 'quiz';

  const entry: XPEntry = {
    type,
    sectionId,
    points,
    timestamp: Date.now(),
  };

  store.entries.push(entry);
  saveStore(store);

  const total = sumEntries(store.entries);
  dispatchXPEvent(points, type, sectionId, total);

  return points;
}

/**
 * Returns the total XP earned across all entries.
 */
export function getTotalXP(): number {
  const store = loadStore();
  return sumEntries(store.entries);
}

/**
 * Returns the full array of XP entries in chronological order.
 */
export function getXPHistory(): XPEntry[] {
  const store = loadStore();
  return [...store.entries];
}

/**
 * Clears all XP data. Intended for testing and debug use only.
 */
export function resetXP(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // localStorage unavailable — silently ignore
  }
}
