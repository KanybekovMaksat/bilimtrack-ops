import { create } from "zustand";
import { useMockQuery } from "@/shared/api";
import type { PillTone } from "@/shared/ui";

/** B2B billing: what an institution pays Bilimtrack under its contract. */
export type OrgBillingStatus = "Оплачено" | "Ожидает" | "Просрочено" | "Бесплатно";

export const orgBillingTone: Record<OrgBillingStatus, PillTone> = {
  Оплачено: "success",
  Ожидает: "info",
  Просрочено: "danger",
  Бесплатно: "neutral",
};

export type OrgBillingRow = {
  org: string;
  orgShort: string;
  plan: string;
  students: string;
  calc: string;
  period: string;
  paidTo: string;
  sum: string;
  status: OrgBillingStatus;
};

export type OrgPayment = {
  date: string;
  org: string;
  sum: string;
  method: string;
  period: string;
  by: string;
  note: string;
  receipt: boolean;
  fresh?: boolean;
};

const DATA = {
  plans: [
    { name: "Базовый", price: "бесплатно", note: "до 100 учащихся, без финансов и приёма", orgs: "11" },
    { name: "Стандарт", price: "15 KGS / учащийся в месяц", note: "все модули, поддержка в рабочие часы", orgs: "18" },
    { name: "Корпоративный", price: "по договору", note: "SLA, интеграции, выделенный менеджер", orgs: "5" },
  ],
  rows: [
    { org: "МУИТ", orgShort: "МУ", plan: "Корпоративный", students: "4 120", calc: "по договору", period: "год", paidTo: "12 мар 2027", sum: "1 800 000 KGS", status: "Оплачено" },
    { org: "Comtehno", orgShort: "CT", plan: "Стандарт", students: "1 840", calc: "1 840 × 15 KGS", period: "месяц", paidTo: "30 сен 2026", sum: "27 600 KGS", status: "Оплачено" },
    { org: "НИШ Алматы", orgShort: "НИ", plan: "Стандарт", students: "980", calc: "980 × 15 KGS", period: "месяц", paidTo: "—", sum: "14 700 KGS", status: "Ожидает" },
    { org: "Школа №61", orgShort: "Ш6", plan: "Стандарт", students: "1 210", calc: "1 210 × 15 KGS", period: "месяц", paidTo: "31 авг 2026", sum: "18 150 KGS", status: "Просрочено" },
    { org: "IT-лицей Astana", orgShort: "IT", plan: "Базовый", students: "560", calc: "—", period: "—", paidTo: "—", sum: "0 KGS", status: "Бесплатно" },
    { org: "Учебный центр «Зерде»", orgShort: "УЗ", plan: "Базовый", students: "140", calc: "—", period: "—", paidTo: "—", sum: "0 KGS", status: "Бесплатно" },
  ] as OrgBillingRow[],
  summary: [
    { n: "1 845 600 KGS", label: "внесено за сентябрь", color: "var(--color-ink)" },
    { n: "14 700 KGS", label: "ожидает оплаты", color: "var(--color-brand)" },
    { n: "18 150 KGS", label: "просрочено", color: "var(--color-red-600)" },
    { n: "23", label: "платных организаций", color: "var(--color-ink)" },
  ],
};

const PAYMENTS: OrgPayment[] = [
  { date: "15 сен 2026", org: "Comtehno", sum: "27 600 KGS", method: "Банковский перевод", period: "сентябрь 2026", by: "Ернар К.", note: "п/п №412 от 15.09", receipt: true },
  { date: "12 сен 2026", org: "МУИТ", sum: "1 800 000 KGS", method: "Банковский перевод", period: "12.03.26 — 12.03.27", by: "Ернар К.", note: "договор №14-К, годовой", receipt: true },
  { date: "02 сен 2026", org: "Школа №61", sum: "18 150 KGS", method: "Optima", period: "август 2026", by: "Айдана С.", note: "", receipt: false },
];

export const PAYMENT_METHODS = ["Банковский перевод", "Наличные", "MBank", "Optima", "Взаимозачёт"];

export const useOrgBilling = () => useMockQuery(["org-billing"], () => DATA);

type OrgPaymentsState = { added: OrgPayment[]; add: (p: OrgPayment) => void };

/** Payments entered by hand in this session, shown on top of the seeded ones. */
export const useOrgPayments = create<OrgPaymentsState>()((set) => ({
  added: [],
  add: (p) => set((s) => ({ added: [{ ...p, fresh: true }, ...s.added] })),
}));

export const SEED_ORG_PAYMENTS = PAYMENTS;
