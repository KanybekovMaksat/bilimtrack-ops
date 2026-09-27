import type { StaffRole } from "@/entities/session";
import { routes } from "@/shared/config";

export type NavItem = { to: string; label: string; icon: string; count?: number; roles: StaffRole[]; also?: string[] };
export type NavGroup = { title: string; items: NavItem[] };

const admin: StaffRole[] = ["admin"];
const everyone: StaffRole[] = ["admin", "content"];

/** Sidebar structure; `also` lists extra path prefixes that keep an item highlighted. */
export const NAV: NavGroup[] = [
  { title: "", items: [{ to: routes.home, label: "Главная", icon: "home", roles: everyone }] },
  {
    title: "Бизнес",
    items: [
      { to: routes.metrics, label: "Сводные метрики", icon: "chart-bar", roles: admin },
      { to: routes.health, label: "Здоровье клиентов", icon: "heart-rate-monitor", count: 4, roles: admin },
    ],
  },
  {
    title: "Продажи",
    items: [
      { to: routes.leads, label: "Заявки на демо", icon: "inbox", count: 7, roles: admin },
      { to: routes.funnel, label: "Воронка", icon: "layout-kanban", roles: admin },
    ],
  },
  {
    title: "Поддержка",
    items: [
      { to: routes.tickets, label: "Тикеты", icon: "lifebuoy", count: 23, roles: admin, also: [routes.ticketStates, routes.ticketPriority] },
      { to: routes.ideas, label: "Идеи", icon: "bulb", count: 3, roles: admin },
    ],
  },
  {
    title: "Клиенты",
    items: [
      { to: routes.orgs, label: "Организации", icon: "building", roles: admin, also: [routes.orgNew] },
      { to: routes.onboarding, label: "Онбординг", icon: "checklist", count: 5, roles: admin },
      { to: routes.licenses, label: "Лицензии и модули", icon: "toggle-right", roles: admin },
      { to: routes.accounts, label: "Аккаунты", icon: "user-search", roles: admin },
      { to: routes.lists, label: "Списки и рассылки", icon: "users-group", roles: admin },
      { to: routes.announcements, label: "Анонсы", icon: "speakerphone", roles: admin },
    ],
  },
  {
    title: "Биллинг",
    items: [
      { to: routes.plans, label: "Тарифы", icon: "cards", roles: admin },
      { to: routes.subscriptions, label: "Подписки", icon: "repeat", roles: admin },
      { to: routes.payments, label: "Платежи", icon: "credit-card", roles: admin },
      { to: routes.providers, label: "Провайдеры", icon: "plug", roles: admin },
      { to: routes.orgBilling, label: "Биллинг организаций", icon: "building-bank", roles: admin },
    ],
  },
  {
    title: "Соцсети",
    items: [
      { to: routes.channels, label: "Каналы", icon: "broadcast", roles: admin },
      { to: routes.inbox, label: "Входящие", icon: "messages", roles: admin },
      { to: routes.templates, label: "Шаблоны", icon: "template", roles: admin },
    ],
  },
  { title: "Задачи", items: [{ to: routes.tasks, label: "Доска задач", icon: "layout-kanban", roles: admin }] },
  {
    title: "Контент",
    items: [
      { to: routes.posts, label: "Статьи", icon: "article", roles: everyone },
      { to: routes.dicts, label: "Справочники", icon: "list-details", roles: everyone },
      { to: routes.media, label: "Медиатека", icon: "photo", roles: everyone },
    ],
  },
  {
    title: "Платформа",
    items: [
      { to: routes.audit, label: "Аудит", icon: "history", roles: admin },
      { to: routes.logins, label: "Логи входов", icon: "login", roles: admin },
      { to: routes.system, label: "Статус системы", icon: "heartbeat", roles: admin },
      { to: routes.errors, label: "Ошибки", icon: "bug", count: 3, roles: admin },
      { to: routes.team, label: "Команда", icon: "users", roles: admin },
    ],
  },
];

export function isActive(item: NavItem, pathname: string) {
  const prefixes = [item.to, ...(item.also ?? [])];
  return prefixes.some((p) => (p === "/" ? pathname === "/" : pathname === p || pathname.startsWith(`${p}/`)));
}
