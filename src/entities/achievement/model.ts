/* Achievement catalog of the platform — backend server/apps/rating (ops_views.py),
   /api/v1/ops/gamification/*. One template per achievement; every organization gets a copy,
   so editing or turning one off here applies everywhere. Awards are never taken back. */

export type AchievementCategory = "profile" | "study" | "community" | "activity" | "special";

export const CATEGORY_LABEL: Record<AchievementCategory, string> = {
  profile: "Профиль",
  study: "Учёба",
  community: "Сообщество",
  activity: "Активность",
  special: "Особые",
};

/** AchievementTemplateSerializer. */
export type Achievement = {
  id: number;
  code: string;
  title: string;
  description: string;
  metric: string;
  metricLabel: string;
  /** For `points` — how many points; flags (photo, Telegram…) ignore it. */
  thresholdPoints: number;
  periodStart: string | null;
  periodEnd: string | null;
  category: AchievementCategory;
  categoryLabel: string;
  isActive: boolean;
  /** Seeded with the code: cannot be deleted or change its condition. */
  isSystem: boolean;
  sortOrder: number;
  /** Distinct learners who earned it; share of active learners with an account (beta excluded). */
  earned: number;
  earnedLast30Days: number;
  earnedShare: number;
  learnersTotal: number;
};

export type AchievementInput = {
  title: string;
  description: string;
  metric: string;
  thresholdPoints: number;
  periodStart: string | null;
  periodEnd: string | null;
  category: AchievementCategory;
  isActive: boolean;
  sortOrder: number;
};

/** MetricOptionSerializer: `flag` — done once (photo uploaded), `counter` — needs a threshold. */
export type AchievementMetric = { value: string; label: string; kind: "flag" | "counter" };
