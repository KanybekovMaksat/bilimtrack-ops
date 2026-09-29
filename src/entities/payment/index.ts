import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, apiPage, QK } from "@/shared/api";
import type { PillTone } from "@/shared/ui";

/* Bilimtrack+ payments (Finik QR) and the Finik webhook log.
   Backend: server/apps/billing (use_cases/ops.py), /api/v1/ops/billing/payments|webhooks/. */

export type PaymentStatus = "pending" | "paid" | "expired" | "failed" | "refunded";

export const paymentStatusLabel: Record<PaymentStatus, string> = {
  pending: "Ожидает оплаты",
  paid: "Оплачен",
  expired: "Истёк",
  failed: "Ошибка",
  refunded: "Возврат",
};

export const paymentTone: Record<PaymentStatus, PillTone> = {
  pending: "warn",
  paid: "success",
  expired: "neutral",
  failed: "danger",
  refunded: "purple",
};

type PersonRef = { id: number; username: string; fullName: string };

/** OpsPaymentSerializer. Decimals arrive as strings. */
export type Payment = {
  id: string;
  user: PersonRef;
  plan: { id: number; code: string; name: string };
  organization: { id: number; name: string } | null;
  unitPrice: string;
  seats: number;
  amount: string;
  paidAmount: string | null;
  currency: string;
  durationDays: number;
  status: PaymentStatus;
  provider: string;
  providerEnvironment: string;
  providerTransactionId: string;
  failureReason: string;
  expiresAt: string;
  paidAt: string | null;
  refundedAt: string | null;
  createdAt: string;
};

export type WebhookOutcome =
  | "processed"
  | "duplicate"
  | "invalid_signature"
  | "malformed"
  | "unknown_payment"
  | "ignored_status"
  | "needs_review";

export const webhookOutcomeLabel: Record<WebhookOutcome, string> = {
  processed: "Проведён",
  duplicate: "Повтор",
  invalid_signature: "Неверная подпись",
  malformed: "Некорректное тело",
  unknown_payment: "Платёж не найден",
  ignored_status: "Статус не «успех»",
  needs_review: "Требует проверки",
};

export const webhookTone: Record<WebhookOutcome, PillTone> = {
  processed: "success",
  duplicate: "neutral",
  invalid_signature: "danger",
  malformed: "danger",
  unknown_payment: "warn",
  ignored_status: "neutral",
  needs_review: "warn",
};

/** OpsWebhookSerializer. */
export type WebhookEvent = {
  id: number;
  receivedAt: string;
  outcome: WebhookOutcome;
  signatureValid: boolean;
  transactionId: string;
  paymentId: string | null;
  detail: string;
  body: string;
};

/** OpsPaymentDetailSerializer. */
export type PaymentDetail = Payment & { recipients: PersonRef[]; webhookEvents: WebhookEvent[] };

export type PaymentFilters = { q?: string; status?: PaymentStatus; planId?: number; page?: number };

export const PAYMENTS_PAGE_SIZE = 50;

export const paymentKeys = {
  list: (f: PaymentFilters) => [QK.billingPayments, "list", f] as const,
  detail: (id: string) => [QK.billingPayments, "detail", id] as const,
};

export const usePayments = (f: PaymentFilters) =>
  useQuery({
    queryKey: paymentKeys.list(f),
    queryFn: () =>
      apiPage<Payment>("ops/billing/payments/", {
        q: f.q,
        status: f.status,
        planId: f.planId,
        page: f.page ?? 1,
        page_size: PAYMENTS_PAGE_SIZE,
      }),
    placeholderData: keepPreviousData,
  });

export const usePaymentDetail = (id: string | null) =>
  useQuery({
    queryKey: paymentKeys.detail(id ?? ""),
    queryFn: () => api<PaymentDetail>(`ops/billing/payments/${id}/`),
    enabled: id !== null,
  });

/** POST ops/billing/payments/:id/refund/ — money goes back in the Finik cabinet; this records it. */
export function useRefundPayment(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (reason: string) => api<PaymentDetail>(`ops/billing/payments/${id}/refund/`, { method: "POST", body: { reason } }),
    onSuccess: (detail) => {
      qc.setQueryData(paymentKeys.detail(id), detail);
      qc.invalidateQueries({ queryKey: [QK.billingPayments, "list"] });
      // Refund revokes access: subscriptions and the summary are stale now.
      qc.invalidateQueries({ queryKey: [QK.billingSubscriptions] });
      qc.invalidateQueries({ queryKey: [QK.billingSummary] });
      qc.invalidateQueries({ queryKey: [QK.billingPlans] });
    },
  });
}

export type WebhookFilters = { outcome?: WebhookOutcome | "attention"; q?: string; page?: number };

export const useWebhooks = (f: WebhookFilters) =>
  useQuery({
    queryKey: [QK.billingWebhooks, f],
    queryFn: () => apiPage<WebhookEvent>("ops/billing/webhooks/", { outcome: f.outcome, q: f.q, page: f.page ?? 1, page_size: PAYMENTS_PAGE_SIZE }),
    placeholderData: keepPreviousData,
  });

/** «1 196 KGS» from a decimal string. */
export const formatMoney = (amount: string | number, currency = "KGS") =>
  `${Number(amount).toLocaleString("ru-RU", { maximumFractionDigits: 2 })} ${currency}`;

export { WebhookBody } from "./ui";
