import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { api, QK } from "@/shared/api";
import type { Achievement, AchievementInput, AchievementMetric } from "./model";

export const achievementKeys = {
  all: [QK.gamification] as const,
  list: [QK.gamification, "achievements"] as const,
  metrics: [QK.gamification, "metrics"] as const,
};

/** GET ops/gamification/achievements/ — the whole catalog, including turned-off ones. */
export const useAchievements = () =>
  useSuspenseQuery({
    queryKey: achievementKeys.list,
    queryFn: () => api<Achievement[]>("ops/gamification/achievements/"),
  }).data;

/** Conditions an achievement can use. */
export const useAchievementMetrics = () =>
  useQuery({
    queryKey: achievementKeys.metrics,
    queryFn: () => api<AchievementMetric[]>("ops/gamification/metrics/"),
    staleTime: Infinity,
  });

export function useCreateAchievement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AchievementInput) => api<Achievement>("ops/gamification/achievements/", { method: "POST", body: input }),
    onSuccess: () => qc.invalidateQueries({ queryKey: achievementKeys.all }),
  });
}

export function useUpdateAchievement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: Partial<AchievementInput> }) =>
      api<Achievement>(`ops/gamification/achievements/${id}/`, { method: "PATCH", body: input }),
    onSuccess: () => qc.invalidateQueries({ queryKey: achievementKeys.all }),
  });
}

export function useDeleteAchievement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api<void>(`ops/gamification/achievements/${id}/`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: achievementKeys.all }),
  });
}
