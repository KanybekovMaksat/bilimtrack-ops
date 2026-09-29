import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { api, QK } from "@/shared/api";

/* Bilimtrack+ plans — what learners pay Bilimtrack (not the organizations' tuition).
   Backend: server/apps/billing (use_cases/ops.py), /api/v1/ops/billing/plans/. */

/** OpsPlanSerializer. Decimals arrive as strings. */
type ApiPlan = {
  id: number;
  code: string;
  name: string;
  description: string;
  price: string;
  currency: string;
  durationDays: number;
  months: number;
  isActive: boolean;
  sortOrder: number;
  isGroup: boolean;
  minSeats: number;
  salesCount: number;
  revenue: string;
  createdAt: string;
  updatedAt: string;
};

export type Plan = Omit<ApiPlan, "price" | "revenue"> & { price: number; revenue: number };

export type PlanInput = {
  code: string;
  name: string;
  description: string;
  price: number;
  durationDays: number;
  isActive: boolean;
  sortOrder: number;
  isGroup: boolean;
  minSeats: number;
};

const toPlan = (p: ApiPlan): Plan => ({ ...p, price: Number(p.price), revenue: Number(p.revenue) });

export const planKeys = { all: [QK.billingPlans] as const };

/** GET ops/billing/plans/ — including plans taken off sale. */
export const usePlans = () =>
  useSuspenseQuery({
    queryKey: planKeys.all,
    queryFn: async () => (await api<ApiPlan[]>("ops/billing/plans/")).map(toPlan),
  }).data;

export function useCreatePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: PlanInput) => api<ApiPlan>("ops/billing/plans/", { method: "POST", body: input }).then(toPlan),
    onSuccess: () => qc.invalidateQueries({ queryKey: planKeys.all }),
  });
}

export function useUpdatePlan(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<PlanInput>) => api<ApiPlan>(`ops/billing/plans/${id}/`, { method: "PATCH", body: input }).then(toPlan),
    onSuccess: () => qc.invalidateQueries({ queryKey: planKeys.all }),
  });
}

/** «12 мес · 365 дн.» */
export const planDuration = (p: Pick<Plan, "months" | "durationDays">) => `${p.months} мес · ${p.durationDays} дн.`;
