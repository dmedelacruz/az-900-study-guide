// src/lib/badgeStore.ts — Badge data layer for the AZ-900 study guide

const STORAGE_KEY = 'az900-badge-data';

export type BadgeTier = 'bronze' | 'silver' | 'gold';

export interface BadgeEntry {
  tier: BadgeTier;
  percentage: number;
  timestamp: number;
}

interface BadgeStore {
  badges: Record<string, BadgeEntry>; // keyed by sectionId
}

const TIER_THRESHOLDS: { tier: BadgeTier; min: number }[] = [
  { tier: 'gold', min: 100 },
  { tier: 'silver', min: 85 },
  { tier: 'bronze', min: 70 },
];

const TIER_RANK: Record<BadgeTier, number> = {
  bronze: 1,
  silver: 2,
  gold: 3,
};

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function loadStore(): BadgeStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as unknown;
      if (
        parsed !== null &&
        typeof parsed === 'object' &&
        'badges' in parsed &&
        typeof (parsed as BadgeStore).badges === 'object' &&
        (parsed as BadgeStore).badges !== null
      ) {
        return parsed as BadgeStore;
      }
    }
  } catch {
    // localStorage unavailable (private browsing) or corrupted data — start fresh
  }
  return { badges: {} };
}

function saveStore(store: BadgeStore): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // localStorage unavailable — silently ignore
  }
}

function dispatchBadgeEvent(
  sectionId: string,
  tier: BadgeTier,
  isNew: boolean,
  isUpgrade: boolean
): void {
  try {
    document.dispatchEvent(
      new CustomEvent('badge:earned', {
        detail: { sectionId, tier, isNew, isUpgrade },
      })
    );
  } catch {
    // document may not be available in SSR/test contexts — silently ignore
  }
}

function computeTier(percentage: number): BadgeTier | null {
  for (const { tier, min } of TIER_THRESHOLDS) {
    if (percentage >= min) return tier;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Awards a badge for a section based on the given percentage score.
 * Computes the tier from the percentage, then saves if it is a new badge or
 * an upgrade over the existing tier. Returns null if the score is below 70%
 * or if the tier has not improved.
 */
export function awardBadge(
  sectionId: string,
  percentage: number
): { tier: BadgeTier; isNew: boolean; isUpgrade: boolean } | null {
  const tier = computeTier(percentage);
  if (tier === null) return null;

  const store = loadStore();
  const existing = store.badges[sectionId] ?? null;

  const isNew = existing === null;
  const isUpgrade = !isNew && TIER_RANK[tier] > TIER_RANK[existing.tier];

  if (!isNew && !isUpgrade) return null;

  store.badges[sectionId] = {
    tier,
    percentage,
    timestamp: Date.now(),
  };

  saveStore(store);
  dispatchBadgeEvent(sectionId, tier, isNew, isUpgrade);

  return { tier, isNew, isUpgrade };
}

/**
 * Returns the badge entry for the given section, or null if none exists.
 */
export function getBadge(sectionId: string): BadgeEntry | null {
  const store = loadStore();
  return store.badges[sectionId] ?? null;
}

/**
 * Returns all badge entries keyed by sectionId.
 */
export function getAllBadges(): Record<string, BadgeEntry> {
  const store = loadStore();
  return { ...store.badges };
}

/**
 * Clears all badge data. Intended for testing and debug use only.
 */
export function resetBadges(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // localStorage unavailable — silently ignore
  }
}
