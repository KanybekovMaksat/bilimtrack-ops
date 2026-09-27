import { useMockQuery } from "@/shared/api";

/** Consumer (student) plans — what learners pay Bilimtrack. */
export type Plan = {
  code: string;
  name: string;
  monthly: string;
  yearly: string;
  active: boolean;
  subscribers: string;
  note: string;
};

const PLANS: Plan[] = [
  { code: "lite", name: "Lite", monthly: "бесплатно", yearly: "—", active: true, subscribers: "39 438", note: "базовый доступ ко всем учебным функциям" },
  { code: "pro", name: "PRO · Bilimtrack+", monthly: "50 KGS / мес", yearly: "250 KGS / год", active: true, subscribers: "1 842", note: "оформление профиля, темы, уведомления в мессенджеры" },
  { code: "pro_family", name: "PRO Семья", monthly: "120 KGS / мес", yearly: "600 KGS / год", active: false, subscribers: "0", note: "черновик: один платёж на трёх детей" },
];

export const PLAN_FEATURES = [
  { name: "Кастомный баннер", desc: "своё оформление профиля вместо серого по умолчанию", on: true },
  { name: "Значок статуса", desc: "особая отметка в ленте, комментариях и рейтинге", on: true },
  { name: "Цветовые темы", desc: "17 акцентных цветов вместо одного", on: true },
  { name: "Уведомления в мессенджеры", desc: "оценки, ДЗ и замены через Telegram и WhatsApp", on: true },
  { name: "Ссылки на соцсети", desc: "Instagram и Telegram в карточке профиля", on: true },
  { name: "Расширенная статистика", desc: "динамика GPA и посещаемости за год", on: false },
  { name: "Экспорт дневника в PDF", desc: "выгрузка оценок за любой период", on: false },
  { name: "Приоритет в поддержке", desc: "обращения PRO выше в очереди", on: false },
  { name: "Анимированная рамка профиля", desc: "градиентная обводка аватара", on: false },
  { name: "Ранний доступ к новым функциям", desc: "бета-фичи до общего релиза", on: false },
];

export const usePlans = () => useMockQuery(["plans"], () => PLANS);
export const usePlan = (code: string) => useMockQuery(["plans", code], () => PLANS.find((p) => p.code === code) ?? PLANS[1]);
