import { routes } from "@/shared/config";

export type NavItem = { to: string; label: string; icon: string; count?: number; also?: string[] };
export type NavGroup = { title: string; items: NavItem[] };

/** Sidebar structure; `also` lists extra path prefixes that keep an item highlighted. */
export const NAV: NavGroup[] = [
  { title: "", items: [{ to: routes.home, label: "Главная", icon: "home" }] },
  {
    title: "Бизнес",
    items: [
      { to: routes.metrics, label: "Сводные метрики", icon: "chart-bar" },
      { to: routes.health, label: "Здоровье клиентов", icon: "heart-rate-monitor", count: 4 },
    ],
  },
  {
    title: "Продажи",
    items: [
      { to: routes.leads, label: "Заявки на демо", icon: "inbox", count: 7 },
    ],
  },
  {
    title: "Поддержка",
    items: [
      { to: routes.tickets, label: "Тикеты", icon: "lifebuoy", count: 23, also: [routes.ticketStates, routes.ticketPriority] },
      { to: routes.ideas, label: "Идеи", icon: "bulb", count: 3 },
    ],
  },
  {
    title: "Клиенты",
    items: [
      { to: routes.orgs, label: "Организации", icon: "building", also: [routes.orgNew] },
      { to: routes.onboarding, label: "Онбординг", icon: "checklist", count: 5 },
      { to: routes.licenses, label: "Лицензии и модули", icon: "toggle-right" },
      { to: routes.accounts, label: "Аккаунты", icon: "user-search" },
    ],
  },
  {
    title: "Биллинг",
    items: [
      { to: routes.plans, label: "Тарифы", icon: "cards" },
      { to: routes.subscriptions, label: "Подписки", icon: "repeat" },
      { to: routes.payments, label: "Платежи", icon: "credit-card" },
      { to: routes.providers, label: "Провайдеры", icon: "plug" },
      { to: routes.orgBilling, label: "Биллинг организаций", icon: "building-bank" },
    ],
  },
  {
    title: "Соцсети",
    items: [
      { to: routes.channels, label: "Каналы", icon: "broadcast" },
      { to: routes.inbox, label: "Входящие", icon: "messages" },
      { to: routes.templates, label: "Шаблоны", icon: "template" },
    ],
  },
  { title: "Задачи", items: [{ to: routes.tasks, label: "Доска задач", icon: "layout-kanban" }] },
  {
    title: "Контент",
    items: [
      { to: routes.posts, label: "Статьи", icon: "article" },
      { to: routes.dicts, label: "Справочники", icon: "list-details" },
      { to: routes.media, label: "Медиатека", icon: "photo" },
    ],
  },
  {
    title: "Платформа",
    items: [
      { to: routes.audit, label: "Аудит", icon: "history" },
      { to: routes.logins, label: "Логи входов", icon: "login" },
      { to: routes.system, label: "Статус системы", icon: "heartbeat" },
      { to: routes.errors, label: "Ошибки", icon: "bug", count: 3 },
      { to: routes.team, label: "Команда", icon: "users" },
    ],
  },
];

export function isActive(item: NavItem, pathname: string) {
  const prefixes = [item.to, ...(item.also ?? [])];
  return prefixes.some((p) => (p === "/" ? pathname === "/" : pathname === p || pathname.startsWith(`${p}/`)));
}
