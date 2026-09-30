import { keepPreviousData, useMutation, useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { api, apiAll, apiPage, QK } from "@/shared/api";
import type { PillTone } from "@/shared/ui";

/* Bilimtrack+ subscriptions, the billing summary and the organization paywall.
   Backend: server/apps/billing (use_cases/ops.py), /api/v1/ops/billing/*. */

export type SubscriptionStatus = "none" | "trial" | "active" | "expired";

export const subscriptionStatusLabel: Record<SubscriptionStatus, string> = {
  none: "Не оформлялась",
  trial: "Пробный период",
  active: "Активна",
  expired: "Истекла",
};

export const subscriptionTone: Record<SubscriptionStatus, PillTone> = {
  none: "neutral",
  trial: "info",
  active: "success",
  expired: "danger",
};

export type PeriodSource = "trial" | "payment" | "manual";

export const periodSourceLabel: Record<PeriodSource, string> = {
  trial: "Пробный",
  payment: "Оплата",
  manual: "Вручную",
};

export type PersonRef = { id: number; username: string; fullName: string };

/** OpsSubscriptionSerializer. */
export type Subscription = {
  id: number;
  user: PersonRef;
  organizationName: string;
  status: SubscriptionStatus;
  accessUntil: string | null;
  trialUsedAt: string | null;
  periodsCount: number;
  updatedAt: string;
};

/** OpsPeriodSerializer. */
export type SubscriptionPeriod = {
  id: number;
  source: PeriodSource;
  startsAt: string;
  endsAt: string;
  plan: { id: number; name: string } | null;
  paymentId: string | null;
  grantedBy: string | null;
  comment: string;
  revokedAt: string | null;
};

/** A payment row inside the subscription card (OpsPaymentSerializer, trimmed to what the card shows). */
export type SubscriptionPaymentRow = {
  id: string;
  plan: { id: number; code: string; name: string };
  seats: number;
  amount: string;
  status: string;
  paidAt: string | null;
  createdAt: string;
};

/** OpsSubscriptionDetailSerializer. */
export type SubscriptionDetail = Subscription & {
  periods: SubscriptionPeriod[];
  payments: SubscriptionPaymentRow[];
};

export type SubscriptionFilters = { q?: string; status?: Exclude<SubscriptionStatus, "none">; page?: number };

export const SUBSCRIPTIONS_PAGE_SIZE = 50;

export const subscriptionKeys = {
  list: (f: SubscriptionFilters) => [QK.billingSubscriptions, "list", f] as const,
  detail: (userId: number) => [QK.billingSubscriptions, "detail", userId] as const,
};

/** Every subscription of the selection (no paging) for the CSV export. */
export const exportSubscriptions = (f: Omit<SubscriptionFilters, "page">) => apiAll<Subscription>("ops/billing/subscriptions/", { q: f.q, status: f.status });

/** GET ops/billing/subscriptions/ — one page with the total. */
export const useSubscriptions = (f: SubscriptionFilters) =>
  useQuery({
    queryKey: subscriptionKeys.list(f),
    queryFn: () =>
      apiPage<Subscription>("ops/billing/subscriptions/", {
        q: f.q,
        status: f.status,
        page: f.page ?? 1,
        page_size: SUBSCRIPTIONS_PAGE_SIZE,
      }),
    placeholderData: keepPreviousData,
  });

/** GET ops/billing/subscriptions/:userId/ — periods and payments (Drawer). */
export const useSubscriptionDetail = (userId: number | null) =>
  useQuery({
    queryKey: subscriptionKeys.detail(userId ?? 0),
    queryFn: () => api<SubscriptionDetail>(`ops/billing/subscriptions/${userId}/`),
    enabled: userId !== null,
  });

export type GrantInput = { userId: number; days: number; comment: string };

function useSubscriptionMutation<TInput>(request: (input: TInput) => Promise<SubscriptionDetail>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: request,
    onSuccess: (detail) => {
      qc.setQueryData(subscriptionKeys.detail(detail.user.id), detail);
      qc.invalidateQueries({ queryKey: [QK.billingSubscriptions, "list"] });
      qc.invalidateQueries({ queryKey: [QK.billingSummary] });
    },
  });
}

/** POST ops/billing/subscriptions/grant/ — days appended to the current access. */
export const useGrantDays = () =>
  useSubscriptionMutation((input: GrantInput) => api<SubscriptionDetail>("ops/billing/subscriptions/grant/", { method: "POST", body: input }));

/** POST ops/billing/subscriptions/:userId/revoke/ — closes access now; money is not returned. */
export const useRevokeAccess = (userId: number) =>
  useSubscriptionMutation((comment: string) =>
    api<SubscriptionDetail>(`ops/billing/subscriptions/${userId}/revoke/`, { method: "POST", body: { comment } }),
  );

/* --- Summary --------------------------------------------------------------- */

/** OpsBillingSummarySerializer. */
export type BillingSummary = {
  activeSubscribers: number;
  trialSubscribers: number;
  expiringIn7Days: number;
  paidThisMonth: { amount: string; count: number };
  pendingPayments: number;
  webhooksNeedAttention: number;
  paywallOrganizations: { id: number; name: string; requiredFrom: string | null }[];
  provider: { name: string; environment: string; configured: boolean };
  trialDays: number;
};

/** GET ops/billing/summary/ — header counters, soft: the page renders without it. */
export const useBillingSummary = () =>
  useQuery({ queryKey: [QK.billingSummary], queryFn: () => api<BillingSummary>("ops/billing/summary/") });

/* --- Organization paywall -------------------------------------------------- */

/** OpsOrganizationBillingSerializer. */
export type OrgPaywall = {
  organizationId: number;
  studentSubscriptionRequired: boolean;
  requiredFrom: string | null;
  paywallActive: boolean;
  learnersCount: number;
  learnersWithSubscription: number;
};

export type OrgPaywallInput = { studentSubscriptionRequired?: boolean; requiredFrom?: string | null };

const orgPaywallKey = (organizationId: number) => [QK.orgPaywall, organizationId] as const;

/** GET ops/organizations/:id/billing/. */
export const useOrgPaywall = (organizationId: number) =>
  useSuspenseQuery({
    queryKey: orgPaywallKey(organizationId),
    queryFn: () => api<OrgPaywall>(`ops/organizations/${organizationId}/billing/`),
  }).data;

export function useUpdateOrgPaywall(organizationId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: OrgPaywallInput) => api<OrgPaywall>(`ops/organizations/${organizationId}/billing/`, { method: "PATCH", body: input }),
    onSuccess: (data) => {
      qc.setQueryData(orgPaywallKey(organizationId), data);
      qc.invalidateQueries({ queryKey: [QK.billingSummary] });
    },
  });
}
