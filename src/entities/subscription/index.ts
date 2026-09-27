import { useMockQuery } from "@/shared/api";
import type { PillTone } from "@/shared/ui";

export type SubscriptionStatus = "Активна" | "Льготный период" | "Истекла" | "Отменена";

export const subscriptionTone: Record<SubscriptionStatus, PillTone> = {
  Активна: "success",
  "Льготный период": "warn",
  Истекла: "danger",
  Отменена: "neutral",
};

export type Subscription = {
  user: string;
  org: string;
  orgShort: string;
  plan: string;
  period: "Месяц" | "Год";
  status: SubscriptionStatus;
  from: string;
  to: string;
  autoRenew: boolean;
  provider: string;
};

const SUBSCRIPTIONS: Subscription[] = [
  { user: "Алишер Темиров", org: "МУИТ", orgShort: "МУ", plan: "PRO", period: "Год", status: "Активна", from: "14 фев 2026", to: "14 фев 2027", autoRenew: true, provider: "MBank" },
  { user: "Мадина Аскарова", org: "МУИТ", orgShort: "МУ", plan: "PRO", period: "Месяц", status: "Льготный период", from: "20 авг 2026", to: "20 сен 2026", autoRenew: true, provider: "O!Деньги" },
  { user: "Ербол Сагындыков", org: "Comtehno", orgShort: "CT", plan: "PRO", period: "Месяц", status: "Активна", from: "02 сен 2026", to: "02 окт 2026", autoRenew: true, provider: "Optima" },
  { user: "Асель Кожабек", org: "Школа №61", orgShort: "Ш6", plan: "PRO", period: "Месяц", status: "Истекла", from: "12 июл 2026", to: "12 авг 2026", autoRenew: false, provider: "Карта" },
  { user: "Нурлан Байзаков", org: "Comtehno", orgShort: "CT", plan: "PRO", period: "Год", status: "Отменена", from: "01 мар 2026", to: "01 мар 2027", autoRenew: false, provider: "MBank" },
  { user: "Гульнара Оспанова", org: "НИШ Алматы", orgShort: "НИ", plan: "PRO", period: "Месяц", status: "Активна", from: "18 сен 2026", to: "18 окт 2026", autoRenew: true, provider: "Внутренний баланс" },
];

export const useSubscriptions = () => useMockQuery(["subscriptions"], () => SUBSCRIPTIONS);
