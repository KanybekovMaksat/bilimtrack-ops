import type { OpsPermission } from "@/entities/session";
import { routes } from "@/shared/config";
import type { IconName } from "@/shared/ui";

/** `counter` = live badge from the API; `demo` = no backend yet, the screen runs on mock data;
    `perm` = Ops privilege (backend `OpsPermission`) the item needs — hidden without it. */
export type NavItem = {
  to: string;
  label: string;
  icon: IconName;
  counter?: "tickets" | "leads";
  demo?: boolean;
  also?: string[];
  perm?: OpsPermission;
};
export type NavGroup = { title: string; items: NavItem[] };

/** Sidebar structure; `also` lists extra path prefixes that keep an item highlighted. */
export const NAV: NavGroup[] = [
  { title: "", items: [{ to: routes.home, label: "Главная", icon: "home" }] },
  {
    title: "Бизнес",
    items: [
      { to: routes.metrics, label: "Сводные метрики", icon: "chart-bar", demo: true },
    ],
  },
  {
    title: "Продажи",
    items: [
      { to: routes.leads, label: "Заявки на демо", icon: "inbox", counter: "leads", perm: "sales" },
    ],
  },
  {
    title: "Поддержка",
    items: [
      { to: routes.tickets, label: "Тикеты", icon: "lifebuoy", counter: "tickets", perm: "support" },
      { to: routes.ideas, label: "Идеи", icon: "bulb", perm: "support" },
      { to: routes.moderation, label: "Модерация", icon: "shield-lock", perm: "moderation" },
    ],
  },
  {
    title: "Клиенты",
    items: [
      { to: routes.orgs, label: "Организации", icon: "building", also: [routes.orgNew] },
      { to: routes.onboarding, label: "Онбординг", icon: "checklist", demo: true },
      { to: routes.licenses, label: "Лицензии и модули", icon: "toggle-right", perm: "licenses" },
      { to: routes.accounts, label: "Аккаунты", icon: "user-search", perm: "accounts" },
    ],
  },
  {
    title: "Биллинг",
    items: [
      { to: routes.plans, label: "Тарифы", icon: "cards", demo: true },
      { to: routes.subscriptions, label: "Подписки", icon: "repeat", demo: true },
      { to: routes.payments, label: "Платежи", icon: "credit-card", demo: true },
      { to: routes.providers, label: "Провайдеры", icon: "plug", demo: true },
      { to: routes.orgBilling, label: "Биллинг организаций", icon: "building-bank", demo: true },
    ],
  },
  {
    title: "Соцсети",
    items: [
      { to: routes.channels, label: "Каналы", icon: "broadcast", demo: true },
      { to: routes.inbox, label: "Входящие", icon: "messages", demo: true },
      { to: routes.templates, label: "Шаблоны", icon: "template", demo: true },
    ],
  },
  { title: "Задачи", items: [{ to: routes.tasks, label: "Доска задач", icon: "layout-kanban", perm: "tasks" }] },
  {
    title: "Контент",
    items: [
      { to: routes.posts, label: "Статьи", icon: "article", perm: "content", also: [routes.postEditor] },
      { to: routes.dicts, label: "Категории и авторы", icon: "tag", perm: "content" },
      { to: routes.media, label: "Обложки", icon: "photo", perm: "content" },
    ],
  },
  {
    title: "Платформа",
    items: [
      { to: routes.audit, label: "Аудит", icon: "history", perm: "audit" },
      { to: routes.logins, label: "Логи входов", icon: "login", perm: "audit" },
      { to: routes.system, label: "Статус системы", icon: "heartbeat" },
      { to: routes.errors, label: "Ошибки", icon: "bug", demo: true },
      { to: routes.team, label: "Команда", icon: "users" },
    ],
  },
];

export function isActive(item: NavItem, pathname: string) {
  const prefixes = [item.to, ...(item.also ?? [])];
  return prefixes.some((p) => (p === "/" ? pathname === "/" : pathname === p || pathname.startsWith(`${p}/`)));
}
