import { formatTime } from "@/shared/lib";
import type { IconName } from "@/shared/ui";

/* Support tickets — backend: server/apps/support (SupportTicketViewSet, /api/v1/support-tickets/). */

export type TicketPriority = "urgent" | "high" | "medium" | "normal" | "low";
export type TicketStatus = "open" | "in_progress" | "resolved" | "closed";
export type TicketSource = "web_portal" | "admin_panel" | "telegram" | "api";
export type TicketCategory = "technical" | "billing" | "training" | "admission" | "partnership" | "feedback" | "other";
export type MessageKind = "user" | "support" | "bot" | "system";
export type SlaState = "over" | "soon" | "ok" | "done";

/** Raw SupportTicketMessageSerializer. */
export type ApiTicketMessage = {
  id: number;
  senderType: MessageKind;
  senderName: string;
  text: string;
  attachment: string | null;
  attachmentName: string;
  source: TicketSource;
  createdAt: string;
};

/** Raw SupportTicketSerializer (organization is a hidden write-only field, so it is not returned). */
export type ApiTicket = {
  id: number;
  createdBy: number | null;
  userContact: string;
  userFullName: string;
  ticketNumber: string;
  source: TicketSource;
  category: TicketCategory;
  priority: TicketPriority;
  subject: string;
  description: string;
  pageUrl: string;
  errorDetails: unknown;
  attachment: string | null;
  status: TicketStatus;
  telegramUserId: number | null;
  telegramUsername: string;
  assignedTo: number | null;
  assignedAgentName: string;
  closedAt: string | null;
  rating: number | null;
  ratingComment: string;
  createdAt: string;
  updatedAt: string;
  messages: ApiTicketMessage[];
};

export type TicketMessage = { kind: MessageKind; who: string; time: string; text: string; attachment?: { url: string; name: string } };

/** UI model of a ticket. */
export type Ticket = {
  id: number;
  number: string;
  subject: string;
  description: string;
  author: string;
  /** Registered user vs. a guest (Telegram bot / public form) with only a contact. */
  hasAccount: boolean;
  contact: string;
  telegramUsername: string;
  category: TicketCategory;
  priority: TicketPriority;
  source: TicketSource;
  status: TicketStatus;
  assignee: string;
  createdAt: string;
  updatedAt: string;
  pageUrl: string;
  errorDetails: unknown;
  rating: number | null;
  ratingComment: string;
  sla: { label: string; state: SlaState };
  messages: TicketMessage[];
};

/** Priority scale, variant A from the design review: only the top of the scale shouts. */
export const PRIORITY: Record<TicketPriority, { label: string; bg: string; fg: string; weight: number; dot: boolean }> = {
  urgent: { label: "Критический", bg: "var(--color-red-500)", fg: "var(--color-white)", weight: 600, dot: false },
  high: { label: "Высокий", bg: "var(--color-orange-50)", fg: "var(--color-warn)", weight: 600, dot: true },
  medium: { label: "Средний", bg: "var(--color-white)", fg: "var(--color-neutral-600)", weight: 500, dot: true },
  normal: { label: "Обычный", bg: "transparent", fg: "var(--color-neutral-500)", weight: 400, dot: false },
  low: { label: "Низкий", bg: "transparent", fg: "var(--color-neutral-400)", weight: 400, dot: false },
};

export const STATUS: Record<TicketStatus, { label: string; color: string }> = {
  open: { label: "Открыто", color: "var(--color-brand)" },
  in_progress: { label: "В работе", color: "var(--color-amber-500)" },
  resolved: { label: "Решено", color: "var(--color-green-500)" },
  closed: { label: "Закрыто", color: "var(--color-neutral-400)" },
};

export const SOURCE: Record<TicketSource, { label: string; icon: IconName; color: string }> = {
  telegram: { label: "Telegram", icon: "brand-telegram", color: "var(--color-blue-500)" },
  web_portal: { label: "Веб-портал", icon: "world", color: "var(--color-neutral-400)" },
  admin_panel: { label: "Панель", icon: "layout-dashboard", color: "var(--color-neutral-400)" },
  api: { label: "API", icon: "code", color: "var(--color-neutral-400)" },
};

export const CATEGORY: Record<TicketCategory, string> = {
  technical: "Техническая проблема",
  billing: "Оплата",
  training: "Обучение работе",
  admission: "Поступление и документы",
  partnership: "Сотрудничество",
  feedback: "Отзыв или предложение",
  other: "Другое",
};

export const SLA_STYLE: Record<SlaState, { bg: string; fg: string; weight: number }> = {
  over: { bg: "var(--color-red-500)", fg: "var(--color-white)", weight: 600 },
  soon: { bg: "var(--color-amber-50)", fg: "var(--color-warn)", weight: 500 },
  ok: { bg: "transparent", fg: "var(--color-neutral-500)", weight: 400 },
  done: { bg: "transparent", fg: "var(--color-neutral-400)", weight: 400 },
};

/** First-response targets, hours. The backend has no SLA yet; the panel computes it. */
const SLA_HOURS: Record<TicketPriority, number> = { urgent: 1, high: 4, medium: 8, normal: 24, low: 24 };

export const SLA_POLICY = "SLA первого ответа: критический 1 ч · высокий 4 ч · средний 8 ч · обычный и низкий 24 ч";

const MIN = 60_000;

function duration(ms: number) {
  const m = Math.max(1, Math.round(ms / MIN));
  if (m < 60) return `${m} мин`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} ч`;
  return `${Math.round(h / 24)} д`;
}

function slaOf(t: ApiTicket, now: number): Ticket["sla"] {
  const answered = t.messages.some((m) => m.senderType === "support");
  if (answered || t.status === "resolved" || t.status === "closed") return { label: "выполнен", state: "done" };
  const left = new Date(t.createdAt).getTime() + SLA_HOURS[t.priority] * 60 * MIN - now;
  if (left <= 0) return { label: `просрочен ${duration(-left)}`, state: "over" };
  if (left <= 60 * MIN) return { label: `осталось ${duration(left)}`, state: "soon" };
  return { label: `в норме · ${duration(left)}`, state: "ok" };
}

export function toTicket(t: ApiTicket, now = Date.now()): Ticket {
  const author = t.userFullName || (t.telegramUsername ? `@${t.telegramUsername}` : "") || t.userContact || "Без имени";
  return {
    id: t.id,
    number: t.ticketNumber,
    subject: t.subject,
    description: t.description,
    author,
    hasAccount: t.createdBy !== null,
    contact: t.userContact,
    telegramUsername: t.telegramUsername,
    category: t.category,
    priority: t.priority,
    source: t.source,
    status: t.status,
    assignee: t.assignedAgentName,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
    pageUrl: t.pageUrl,
    errorDetails: t.errorDetails,
    rating: t.rating,
    ratingComment: t.ratingComment,
    sla: slaOf(t, now),
    messages: [...t.messages]
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .map((m) => ({
        kind: m.senderType,
        who: m.senderType === "support" ? `Поддержка · ${m.senderName}` : m.senderName || (m.senderType === "bot" ? "Бот Lucky" : author),
        time: formatTime(m.createdAt),
        text: m.text,
        attachment: m.attachment ? { url: m.attachment, name: m.attachmentName || "Вложение" } : undefined,
      })),
  };
}

export const isOpen = (t: Pick<Ticket, "status">) => t.status === "open" || t.status === "in_progress";
