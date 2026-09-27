import { useMockQuery } from "@/shared/api";
import type { PillTone } from "@/shared/ui";

export type PaymentStatus = "В обработке" | "Успешно" | "Ошибка" | "Возврат";

export const paymentTone: Record<PaymentStatus, PillTone> = {
  "В обработке": "warn",
  Успешно: "success",
  Ошибка: "danger",
  Возврат: "purple",
};

export type Payment = {
  id: number;
  date: string;
  user: string;
  org: string;
  sum: string;
  provider: string;
  txn: string;
  status: PaymentStatus;
  gift: boolean;
  /** Stuck "in progress" for more than 15 minutes. */
  stuckFor?: string;
  providerResponse: string;
};

const response = (provider: string, txn: string, state: string, amount: number, created: string, webhook: string | null, attempts = 1) =>
  JSON.stringify(
    { provider, txn_id: txn, state, amount, currency: "KGS", created_at: created, last_webhook: webhook, attempts },
    null,
    2,
  );

const PAYMENTS: Payment[] = [
  { id: 0, date: "20 сен, 15:41", user: "Мадина Аскарова", org: "МУИТ", sum: "50 KGS", provider: "O!Деньги", txn: "OD-99412703", status: "В обработке", gift: false, stuckFor: "22 минуты", providerResponse: response("odengi", "OD-99412703", "pending", 5000, "2026-09-20T15:41:02+06:00", null, 3) },
  { id: 1, date: "20 сен, 14:08", user: "Алишер Темиров", org: "МУИТ", sum: "250 KGS", provider: "MBank", txn: "MB-4410928", status: "Успешно", gift: false, providerResponse: response("mbank", "MB-4410928", "success", 25000, "2026-09-20T14:08:11+06:00", "2026-09-20T14:08:14+06:00") },
  { id: 2, date: "20 сен, 11:55", user: "Гульнара Оспанова", org: "НИШ Алматы", sum: "0 KGS", provider: "Внутренний баланс", txn: "GIFT-00184", status: "Успешно", gift: true, providerResponse: response("internal", "GIFT-00184", "success", 0, "2026-09-20T11:55:40+06:00", null) },
  { id: 3, date: "19 сен, 20:12", user: "Ербол Сагындыков", org: "Comtehno", sum: "50 KGS", provider: "Optima", txn: "OP-77120934", status: "Ошибка", gift: false, providerResponse: response("optima", "OP-77120934", "declined", 5000, "2026-09-19T20:12:03+06:00", "2026-09-19T20:12:09+06:00") },
  { id: 4, date: "19 сен, 09:30", user: "Асель Кожабек", org: "Школа №61", sum: "50 KGS", provider: "Карта", txn: "CRD-8812004", status: "Возврат", gift: false, providerResponse: response("acquiring", "CRD-8812004", "refunded", 5000, "2026-09-19T09:30:22+06:00", "2026-09-19T10:02:47+06:00") },
  { id: 5, date: "18 сен, 17:02", user: "Нурлан Байзаков", org: "Comtehno", sum: "250 KGS", provider: "MBank", txn: "MB-4399812", status: "Успешно", gift: false, providerResponse: response("mbank", "MB-4399812", "success", 25000, "2026-09-18T17:02:55+06:00", "2026-09-18T17:02:58+06:00") },
];

export const usePayments = () => useMockQuery(["payments"], () => PAYMENTS);

export type ProviderHealth = "Норма" | "Деградация" | "Сбой";

export const PROVIDER_HEALTH: Record<ProviderHealth, { dot: string; fg: string }> = {
  Норма: { dot: "#00c951", fg: "#00a63e" },
  Деградация: { dot: "#fd9a00", fg: "#c2410c" },
  Сбой: { dot: "#fb2c36", fg: "#e7000b" },
};

export type PaymentProvider = { name: string; status: ProviderHealth; lastWebhook: string; errors: string; share: string; enabled: boolean };

const PROVIDERS: PaymentProvider[] = [
  { name: "MBank", status: "Норма", lastWebhook: "2 минуты назад", errors: "0", share: "58%", enabled: true },
  { name: "Optima", status: "Деградация", lastWebhook: "41 минуту назад", errors: "7", share: "19%", enabled: true },
  { name: "O!Деньги", status: "Норма", lastWebhook: "6 минут назад", errors: "1", share: "14%", enabled: true },
  { name: "Карта (эквайринг)", status: "Норма", lastWebhook: "4 минуты назад", errors: "0", share: "8%", enabled: true },
  { name: "Внутренний баланс", status: "Норма", lastWebhook: "—", errors: "0", share: "1%", enabled: true },
];

export const usePaymentProviders = () => useMockQuery(["providers"], () => PROVIDERS);
