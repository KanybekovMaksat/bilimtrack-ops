/* User activity in the client app. Backend: server/apps/analytics (use_cases/reports.py),
   /api/v1/ops/analytics/{overview,heatmap,pages,breakdown,organizations,retention,features,users/<id>}/.
   Sessions end after 30 min without activity; durations are active time only (visible tab, input in the last minute). */

export type Portal = "learner" | "mentor" | "guardian" | "other";
export type Device = "desktop" | "mobile" | "tablet";

export type AnalyticsFilters = {
  dateFrom?: string;
  dateTo?: string;
  organizationId?: number;
  portal?: Portal;
  device?: Device;
  includeBeta?: boolean;
};

/** KpisSerializer. */
export type Kpis = {
  dau: number;
  sessions: number;
  avgSessionSeconds: number | null;
  medianSessionSeconds: number | null;
  sessionsPerUser: number | null;
  uniqueUsers: number;
  newUsers: number;
  returningUsers: number;
  totalActiveSeconds: number;
  pageViews: number;
  bounceRate: number | null;
};

export type SeriesPoint = {
  date: string;
  users: number;
  sessions: number;
  avgSessionSeconds: number | null;
  medianSessionSeconds: number | null;
  totalActiveSeconds: number;
};

export type DurationBucket = { key: string; fromSeconds: number; toSeconds: number | null; sessions: number };

/** OverviewSerializer. */
export type Overview = {
  dateFrom: string;
  dateTo: string;
  days: number;
  kpis: Kpis;
  previous: Kpis;
  reach: { dau: number; wau: number; mau: number; stickiness: number | null };
  series: SeriesPoint[];
  durations: DurationBucket[];
};

/** HeatmapSerializer. */
export type Heatmap = {
  cells: { weekday: number; hour: number; sessions: number; users: number }[];
  byHour: number[];
  byWeekday: number[];
  peak: { weekday: number; hour: number } | null;
  maxSessions: number;
};

/** PageStatSerializer. */
export type PageStat = {
  path: string;
  views: number;
  users: number;
  avgSeconds: number;
  totalSeconds: number;
  entries: number;
  exits: number;
  exitRate: number | null;
};

export type BreakdownRow = { key: string; label?: string; sessions: number; users: number; avgSessionSeconds: number | null };
/** BreakdownSerializer. */
export type Breakdown = { portals: BreakdownRow[]; devices: BreakdownRow[]; browsers: BreakdownRow[]; os: BreakdownRow[] };

export type RiskReason = "no_activity_7d" | "activity_drop" | "low_adoption";

/** OrganizationActivitySerializer. */
export type OrgActivity = {
  organization: { id: number; name: string };
  category: string;
  members: number;
  dau: number;
  users: number;
  users7d: number;
  usersPrev7d: number;
  users30d: number;
  change7d: number | null;
  activeShare30d: number | null;
  sessions: number;
  avgSessionSeconds: number | null;
  totalActiveSeconds: number;
  featureUsers: number;
  lastSeenAt: string | null;
  risk: boolean;
  riskReasons: RiskReason[];
};

export type RetentionRates = { d1: number | null; d7: number | null; d30: number | null };
/** RetentionSerializer. */
export type Retention = {
  cohorts: (RetentionRates & { weekStart: string; size: number; weeks: (number | null)[] })[];
  summary: RetentionRates;
};

export type FeatureStat = { feature: string; label: string; events: number; users: number; organizations: number; previousEvents: number };
/** FeaturesSerializer. */
export type Features = {
  features: FeatureStat[];
  catalog: { value: string; label: string }[];
  activation: { newUsers: number; activated: number; rate: number | null };
};

export type UserSession = {
  id: string;
  startedAt: string;
  lastSeenAt: string;
  activeSeconds: number;
  pageViews: number;
  entryPath: string;
  portal: Portal;
  deviceType: string;
  browser: string;
  os: string;
  organization: { id: number; name: string } | null;
};

/** UserActivitySerializer. */
export type UserActivity = {
  userId: number;
  days: number;
  firstSeenAt: string | null;
  lastSeenAt: string | null;
  sessions: number;
  activeDays: number;
  totalActiveSeconds: number;
  avgSessionSeconds: number | null;
  medianSessionSeconds: number | null;
  topPages: { path: string; views: number; totalSeconds: number }[];
  byHour: number[];
  recentSessions: UserSession[];
  features: { feature: string; label: string; events: number }[];
};

export const PORTAL_LABEL: Record<Portal, string> = { learner: "Студенты", mentor: "Менторы", guardian: "Родители", other: "Общие страницы" };
export const DEVICE_LABEL: Record<Device, string> = { desktop: "Компьютер", mobile: "Телефон", tablet: "Планшет" };
export const RISK_LABEL: Record<RiskReason, string> = {
  no_activity_7d: "никто не заходил 7 дней",
  activity_drop: "активность упала вдвое за неделю",
  low_adoption: "за 30 дней заходили меньше 30% участников",
};
/** Short form for pills in tables; the full sentence goes into the tooltip. */
export const RISK_SHORT: Record<RiskReason, string> = {
  no_activity_7d: "нет входов 7 дней",
  activity_drop: "активность упала",
  low_adoption: "мало активных",
};
export const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
export const DURATION_LABEL: Record<string, string> = {
  lt30s: "< 30 сек",
  "30s_1m": "30 сек – 1 мин",
  "1_5m": "1–5 мин",
  "5_15m": "5–15 мин",
  "15_30m": "15–30 мин",
  gte30m: "30 мин +",
};

/** Human names of the client app's route templates; unknown ones show as the path itself. */
const PAGE_NAMES: Record<string, string> = {
  "/learner": "Студент · главная",
  "/learner/diary": "Студент · дневник",
  "/learner/diary/grades": "Студент · оценки",
  "/learner/diary/ratings": "Студент · рейтинги в дневнике",
  "/learner/diary/themes": "Студент · темы",
  "/learner/schedule": "Студент · расписание",
  "/learner/rating": "Студент · рейтинг",
  "/learner/forum": "Студент · форум",
  "/learner/forum/[id]": "Студент · пост форума",
  "/learner/chats": "Студент · чаты",
  "/learner/chats/[id]": "Студент · чат",
  "/learner/notifications": "Студент · уведомления",
  "/learner/profile": "Студент · профиль",
  "/learner/[username]": "Студент · чужой профиль",
  "/learner/search": "Студент · поиск",
  "/mentor": "Ментор · главная",
  "/mentor/journal": "Ментор · журнал",
  "/mentor/timetable": "Ментор · расписание",
  "/mentor/chats": "Ментор · чаты",
  "/mentor/chats/[id]": "Ментор · чат",
  "/mentor/news": "Ментор · новости",
  "/mentor/archive": "Ментор · архив",
  "/mentor/profile": "Ментор · профиль",
  "/mentor/settings": "Ментор · настройки",
  "/guardian": "Родитель · главная",
  "/guardian/diary": "Родитель · дневник",
  "/guardian/schedule": "Родитель · расписание",
  "/guardian/finance": "Родитель · финансы",
};
export const pageName = (path: string) => PAGE_NAMES[path] ?? null;

/** Relative change of `now` vs `before`; null when there is nothing to compare with. */
export function change(now: number | null | undefined, before: number | null | undefined) {
  if (now == null || before == null || before === 0) return null;
  return (now - before) / before;
}
