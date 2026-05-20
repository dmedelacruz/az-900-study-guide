// src/lib/progressStore.ts — Centralized progress tracker for the AZ-900 study guide

const SECTIONS_READ_KEY = 'az900-sections-read';
const QUIZ_SCORES_KEY = 'az900-quiz-scores';

export interface QuizScore {
  score: number;
  total: number;
  percentage: number;
  timestamp: number;
}

export interface ProgressStore {
  sectionsRead: string[];               // array of sectionId strings
  quizScores: Record<string, QuizScore>; // keyed by sectionId
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function loadStore(): ProgressStore {
  let sectionsRead: string[] = [];
  let quizScores: Record<string, QuizScore> = {};

  try {
    const rawSections = localStorage.getItem(SECTIONS_READ_KEY);
    if (rawSections) {
      const parsed = JSON.parse(rawSections) as unknown;
      if (Array.isArray(parsed)) {
        sectionsRead = parsed as string[];
      }
    }
  } catch {
    // localStorage unavailable (private browsing) or corrupted data — start fresh
  }

  try {
    const rawScores = localStorage.getItem(QUIZ_SCORES_KEY);
    if (rawScores) {
      const parsed = JSON.parse(rawScores) as unknown;
      if (
        parsed !== null &&
        typeof parsed === 'object' &&
        !Array.isArray(parsed)
      ) {
        quizScores = parsed as Record<string, QuizScore>;
      }
    }
  } catch {
    // localStorage unavailable (private browsing) or corrupted data — start fresh
  }

  return { sectionsRead, quizScores };
}

function saveSectionsRead(sectionsRead: string[]): void {
  try {
    localStorage.setItem(SECTIONS_READ_KEY, JSON.stringify(sectionsRead));
  } catch {
    // localStorage unavailable — silently ignore
  }
}

function saveQuizScores(quizScores: Record<string, QuizScore>): void {
  try {
    localStorage.setItem(QUIZ_SCORES_KEY, JSON.stringify(quizScores));
  } catch {
    // localStorage unavailable — silently ignore
  }
}

function dispatchProgressEvent(eventName: string, detail: Record<string, unknown>): void {
  try {
    document.dispatchEvent(new CustomEvent(eventName, { detail }));
  } catch {
    // document may not be available in SSR/test contexts — silently ignore
  }
}

// ---------------------------------------------------------------------------
// Public API — Sections read
// ---------------------------------------------------------------------------

/**
 * Returns true if the given section has been marked as read.
 */
export function isSectionRead(sectionId: string): boolean {
  const { sectionsRead } = loadStore();
  return sectionsRead.includes(sectionId);
}

/**
 * Marks a section as read. Dispatches 'progress:section-read' event.
 * No-op if already marked.
 */
export function markSectionRead(sectionId: string): void {
  const { sectionsRead } = loadStore();
  if (sectionsRead.includes(sectionId)) return;

  const updated = [...sectionsRead, sectionId];
  saveSectionsRead(updated);
  dispatchProgressEvent('progress:section-read', { sectionId });
}

/**
 * Removes a section from the read list. Dispatches 'progress:section-unread' event.
 * No-op if not currently marked.
 */
export function unmarkSectionRead(sectionId: string): void {
  const { sectionsRead } = loadStore();
  if (!sectionsRead.includes(sectionId)) return;

  const updated = sectionsRead.filter((id) => id !== sectionId);
  saveSectionsRead(updated);
  dispatchProgressEvent('progress:section-unread', { sectionId });
}

/**
 * Returns the set of all read section IDs.
 */
export function getReadSections(): Set<string> {
  const { sectionsRead } = loadStore();
  return new Set(sectionsRead);
}

/**
 * Returns the count of sections that have been marked as read.
 */
export function getReadSectionCount(): number {
  const { sectionsRead } = loadStore();
  return sectionsRead.length;
}

// ---------------------------------------------------------------------------
// Public API — Quiz scores
// ---------------------------------------------------------------------------

/**
 * Saves a quiz score for the given section. Computes percentage automatically.
 * Overwrites any existing score for the section.
 * Dispatches 'progress:quiz-scored' event.
 */
export function saveQuizScore(sectionId: string, score: number, total: number): void {
  const { quizScores } = loadStore();
  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;

  const updated: Record<string, QuizScore> = {
    ...quizScores,
    [sectionId]: { score, total, percentage, timestamp: Date.now() },
  };

  saveQuizScores(updated);
  dispatchProgressEvent('progress:quiz-scored', { sectionId, score, total, percentage });
}

/**
 * Returns the quiz score for the given section, or null if none exists.
 */
export function getQuizScore(sectionId: string): QuizScore | null {
  const { quizScores } = loadStore();
  return quizScores[sectionId] ?? null;
}

/**
 * Returns all quiz scores keyed by sectionId.
 */
export function getAllQuizScores(): Record<string, QuizScore> {
  const { quizScores } = loadStore();
  return { ...quizScores };
}

// ---------------------------------------------------------------------------
// Public API — Aggregate
// ---------------------------------------------------------------------------

/**
 * Returns the completion percentage as a rounded integer.
 * Computed as (readSectionCount / totalSections) * 100.
 * Returns 0 if totalSections is 0 to avoid division by zero.
 */
export function getCompletionPercentage(totalSections: number): number {
  if (totalSections <= 0) return 0;
  const { sectionsRead } = loadStore();
  return Math.round((sectionsRead.length / totalSections) * 100);
}

// ---------------------------------------------------------------------------
// Public API — Reset
// ---------------------------------------------------------------------------

/**
 * Clears all progress data from localStorage. Intended for testing and debug use only.
 */
export function resetProgress(): void {
  try {
    localStorage.removeItem(SECTIONS_READ_KEY);
  } catch {
    // localStorage unavailable — silently ignore
  }
  try {
    localStorage.removeItem(QUIZ_SCORES_KEY);
  } catch {
    // localStorage unavailable — silently ignore
  }
}
