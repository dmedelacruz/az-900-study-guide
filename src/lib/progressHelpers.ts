// src/lib/progressHelpers.ts — Aggregates data from all stores for the dashboard

import { getTotalXP, getXPHistory, type XPEntry } from './xpStore';
import { getAllBadges, type BadgeEntry, type BadgeTier } from './badgeStore';
import { getStreak } from './streakStore';
import { getReadSections, getAllQuizScores, type QuizScore } from './progressStore';

export interface DomainProgress {
  domain: string;
  weight: string;
  sections: {
    id: string;
    title: string;
    href: string;
    isRead: boolean;
    badge: { tier: BadgeTier; percentage: number } | null;
    quizScore: QuizScore | null;
  }[];
  readCount: number;
  totalCount: number;
}

export interface DashboardData {
  totalXP: number;
  xpHistory: XPEntry[];
  streak: { currentStreak: number; longestStreak: number; lastActivityDate: string | null };
  domains: DomainProgress[];
  overallReadCount: number;
  overallTotalCount: number;
  badgeCounts: { bronze: number; silver: number; gold: number };
  weakSections: { id: string; title: string; href: string; percentage: number }[];
  quizScores: Record<string, QuizScore>;
}

export interface SectionInput {
  id: string;
  title: string;
  href: string;
}

export interface DomainInput {
  domain: string;
  weight: string;
  sections: SectionInput[];
}

export function getDashboardData(domainInputs: DomainInput[]): DashboardData {
  const totalXP = getTotalXP();
  const xpHistory = getXPHistory();
  const streak = getStreak();
  const allBadges = getAllBadges();
  const readSections = getReadSections();
  const quizScores = getAllQuizScores();

  let overallReadCount = 0;
  let overallTotalCount = 0;
  const badgeCounts = { bronze: 0, silver: 0, gold: 0 };
  const weakSections: DashboardData['weakSections'] = [];

  const domains: DomainProgress[] = domainInputs.map((input) => {
    const sections = input.sections.map((s) => {
      const isRead = readSections.has(s.id);
      const badgeEntry = allBadges[s.id] ?? null;
      const badge = badgeEntry ? { tier: badgeEntry.tier, percentage: badgeEntry.percentage } : null;
      const quizScore = quizScores[s.id] ?? null;

      if (badge) {
        badgeCounts[badge.tier]++;
        if (badge.percentage < 85) {
          weakSections.push({ id: s.id, title: s.title, href: s.href, percentage: badge.percentage });
        }
      }

      return { id: s.id, title: s.title, href: s.href, isRead, badge, quizScore };
    });

    const readCount = sections.filter((s) => s.isRead).length;
    overallReadCount += readCount;
    overallTotalCount += sections.length;

    return {
      domain: input.domain,
      weight: input.weight,
      sections,
      readCount,
      totalCount: sections.length,
    };
  });

  weakSections.sort((a, b) => a.percentage - b.percentage);

  return {
    totalXP,
    xpHistory,
    streak,
    domains,
    overallReadCount,
    overallTotalCount,
    badgeCounts,
    weakSections,
    quizScores,
  };
}
