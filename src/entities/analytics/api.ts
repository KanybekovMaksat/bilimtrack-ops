import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { api, QK } from "@/shared/api";
import type { AchievementsReport, AnalyticsFilters, Breakdown, Features, Heatmap, OrgActivity, Overview, PageStat, Retention, UserActivity } from "./model";

export const analyticsKeys = {
  all: [QK.analytics] as const,
  report: (name: string, f: AnalyticsFilters, extra: Record<string, string | undefined>) => [QK.analytics, name, f, extra] as const,
  user: (id: number | undefined) => [QK.analytics, "user", id] as const,
};

const params = (f: AnalyticsFilters) => ({
  dateFrom: f.dateFrom,
  dateTo: f.dateTo,
  organizationId: f.organizationId,
  portal: f.portal,
  device: f.device,
  includeBeta: f.includeBeta ? "true" : undefined,
});

const useReport = <T,>(name: string, f: AnalyticsFilters, extra: Record<string, string | undefined> = {}) =>
  useQuery({
    queryKey: analyticsKeys.report(name, f, extra),
    queryFn: () => api<T>(`ops/analytics/${name}/`, { query: { ...params(f), ...extra } }),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });

export const useAnalyticsOverview = (f: AnalyticsFilters) => useReport<Overview>("overview", f);
export const useAnalyticsHeatmap = (f: AnalyticsFilters) => useReport<Heatmap>("heatmap", f);
export const useAnalyticsPages = (f: AnalyticsFilters) => useReport<PageStat[]>("pages", f);
export const useAnalyticsBreakdown = (f: AnalyticsFilters) => useReport<Breakdown>("breakdown", f);
export const useAnalyticsRetention = (f: AnalyticsFilters) => useReport<Retention>("retention", f);
export const useAnalyticsFeatures = (f: AnalyticsFilters) => useReport<Features>("features", f);
export const useAnalyticsAchievements = (f: AnalyticsFilters) => useReport<AchievementsReport>("achievements", f);
export const useOrgActivity = (f: AnalyticsFilters, riskOnly = false) =>
  useReport<OrgActivity[]>("organizations", f, { riskOnly: riskOnly ? "true" : undefined });

export const useUserActivity = (userId: number | undefined) =>
  useQuery({
    queryKey: analyticsKeys.user(userId),
    queryFn: () => api<UserActivity>(`ops/analytics/users/${userId}/`),
    enabled: !!userId,
    staleTime: 60_000,
  });

