import type { IconName } from "@/shared/ui";

/* Support tickets — backend: server/apps/support, helpdesk API `/api/v1/ops/tickets/` (use_cases/helpdesk.py). */

export type TicketPriority = "urgent" | "high" | "medium" | "normal" | "low";
export type TicketStatus = "open" | "in_progress" | "resolved" | "closed";
export type TicketSource = "web_portal" | "admin_panel" | "telegram" | "api";
export type TicketCategory = "technical" | "billing" | "training" | "admission" | "partnership" | "feedback" | "other";
export type MessageKind = "user" | "support" | "bot" | "system";
export type SlaState = "over" | "soon" | "ok" | "done";

/** HelpdeskMessageSerializer. */
export type ApiTicketMessage = {
  id: number;
  senderType: MessageKind;
  senderUserId: number | null;
  senderName: string;
  text: string;
  attachment: string | null;
  attachmentName: string;
  source: TicketSource;
  isInternal: boolean;
  createdAt: string;
};

/** HelpdeskTicketSerializer — a queue row: the thread summary, no messages. */
export type ApiTicket = {
  id: number;
  ticketNumber: string;
  subject: string;
  category: TicketCategory;
  priority: TicketPriority;
  source: TicketSource;
  status: TicketStatus;
  organization: { id: number; name: string } | null;
  /** null — a guest (public form / Telegram bot) with only a contact. */
  author: { id: number; username: string } | null;
  userFullName: string;
  userContact: string;
  telegramUsername: string;
  /** `id: null` — an agent assigned from the Telegram group, known by name only. */
  assignee: { id: number | null; name: string } | null;
  isUnread: boolean;
  lastMessageAt: string;
  lastMessageSenderType: "user" | "support" | "";
  lastMessagePreview: string;
  firstResponseAt: string | null;
  slaDueAt: string;
  slaState: SlaState;
  rating: number | null;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
};

export type TicketLogAction = "created" | "assigned" | "replied" | "status_changed" | "closed" | "reopened" | "updated" | "note";

/** HelpdeskLogSerializer. */
export type TicketLog = { id: number; action: TicketLogAction; actorName: string; details: Record<string, unknown>; createdAt: string };

/** HelpdeskTicketDetailSerializer. */
export type ApiTicketDetail = ApiTicket & {
  description: string;
  pageUrl: string;
  errorDetails: unknown;
  attachment: string | null;
  ipAddress: string | null;
  userAgent: string;
  ratingComment: string;
  ratedAt: string | null;
  messages: ApiTicketMessage[];
  logs: TicketLog[];
  requesterTickets: { id: number; ticketNumber: string; subject: string; status: TicketStatus; createdAt: string }[];
};

/** HelpdeskSummarySerializer. */
export type TicketSummary = {
  open: number;
  inProgress: number;
  done: number;
  all: number;
  unread: number;
  awaiting: number;
  mine: number;
  sla: { over: number; soon: number; ok: number };
};

/** HelpdeskTemplateSerializer. `{name}`, `{ticket}`, `{operator}` in the text are filled by `fillTemplate`. */
export type ReplyTemplate = {
  id: number;
  title: string;
  text: string;
  category: TicketCategory | "";
  isActive: boolean;
  position: number;
  usageCount: number;
  updatedAt: string;
};

export type ReplyTemplateInput = Pick<ReplyTemplate, "title" | "text" | "category" | "isActive">;

export type TicketMessage = {
  id: number;
  kind: MessageKind;
  /** Team note: the requester never sees it. */
  internal: boolean;
  who: string;
  createdAt: string;
  text: string;
  attachment?: { url: string; name: string };
};

/** UI model of a queue row. */
export type Ticket = {
  id: number;
  number: string;
  subject: string;
  author: string;
  /** Name as the requester gave it; empty when only a contact or a Telegram handle is known. */
  fullName: string;
  /** Registered user vs. a guest (Telegram bot / public form) with only a contact. */
  hasAccount: boolean;
  /** Login of the author's account, for a direct link to it. */
  username: string | null;
  contact: string;
  telegramUsername: string;
  organization: { id: number; name: string } | null;
  category: TicketCategory;
  priority: TicketPriority;
  source: TicketSource;
  status: TicketStatus;
  assignee: { id: number | null; name: string } | null;
  /** The requester wrote something nobody on the team has opened yet. */
  unread: boolean;
  /** In work and the last word is the requester's. */
  awaitingReply: boolean;
  lastMessageAt: string;
  lastMessageBy: "user" | "support" | "";
  lastMessagePreview: string;
  createdAt: string;
  updatedAt: string;
  rating: number | null;
  sla: { label: string; state: SlaState };
};

export type TicketDetail = Ticket & {
  description: string;
  pageUrl: string;
  errorDetails: unknown;
  attachment: string | null;
  ipAddress: string | null;
  userAgent: string;
  ratingComment: string;
  messages: TicketMessage[];
  logs: TicketLog[];
  requesterTickets: { id: number; number: string; subject: string; status: TicketStatus; createdAt: string }[];
};

/** Queue filters, 1:1 with the query of `GET ops/tickets/`. */
export type TicketFilters = {
  q?: string;
  status?: TicketStatus[];
  priority?: TicketPriority[];
  category?: TicketCategory[];
  source?: TicketSource[];
  /** «me» | «none» | operator id. */
  assignee?: string;
  /** Organization id | «none». */
  organizationId?: string;
  sla?: Exclude<SlaState, "done">;
  unread?: boolean;
  awaiting?: boolean;
  /** Column key, `-key` for descending (see `ORDERING` in use_cases/helpdesk.py). */
  ordering?: string;
  page?: number;
  pageSize?: number;
};

export const TICKETS_PAGE_SIZE = 50;

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

export const SLA_POLICY = "SLA первого ответа: критический 1 ч · высокий 4 ч · средний 8 ч · обычный и низкий 24 ч";

export const LOG_ACTION: Record<TicketLogAction, string> = {
  created: "создал(а) обращение",
  assigned: "назначил(а) исполнителя",
  replied: "написал(а)",
  status_changed: "сменил(а) статус",
  closed: "закрыл(а) тикет",
  reopened: "открыл(а) заново",
  updated: "изменил(а) поля",
  note: "оставил(а) заметку",
};

const MIN = 60_000;

function duration(ms: number) {
  const m = Math.max(1, Math.round(ms / MIN));
  if (m < 60) return `${m} мин`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} ч`;
  return `${Math.round(h / 24)} д`;
}

/**
 * SLA of the first reply. The deadline and «answered» come from the server; the state is recomputed
 * against the local clock, so a row that sat in a cached list still turns red on time.
 */
function slaOf(t: ApiTicket, now: number): Ticket["sla"] {
  if (t.firstResponseAt || t.status === "resolved" || t.status === "closed") return { label: "выполнен", state: "done" };
  const left = new Date(t.slaDueAt).getTime() - now;
  if (left <= 0) return { label: `просрочен ${duration(-left)}`, state: "over" };
  if (left <= 60 * MIN) return { label: `осталось ${duration(left)}`, state: "soon" };
  return { label: `в норме · ${duration(left)}`, state: "ok" };
}

export const isOpen = (t: Pick<Ticket, "status">) => t.status === "open" || t.status === "in_progress";

export function toTicket(t: ApiTicket, now = Date.now()): Ticket {
  return {
    id: t.id,
    number: t.ticketNumber,
    subject: t.subject,
    author: t.userFullName || (t.telegramUsername ? `@${t.telegramUsername}` : "") || t.userContact || t.author?.username || "Без имени",
    fullName: t.userFullName,
    hasAccount: t.author !== null,
    username: t.author?.username ?? null,
    contact: t.userContact,
    telegramUsername: t.telegramUsername,
    organization: t.organization,
    category: t.category,
    priority: t.priority,
    source: t.source,
    status: t.status,
    assignee: t.assignee,
    unread: t.isUnread,
    awaitingReply: isOpen(t) && t.lastMessageSenderType === "user",
    lastMessageAt: t.lastMessageAt,
    lastMessageBy: t.lastMessageSenderType,
    lastMessagePreview: t.lastMessagePreview,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
    rating: t.rating,
    sla: slaOf(t, now),
  };
}

export function toTicketDetail(t: ApiTicketDetail, now = Date.now()): TicketDetail {
  const row = toTicket(t, now);
  return {
    ...row,
    description: t.description,
    pageUrl: t.pageUrl,
    errorDetails: t.errorDetails,
    attachment: t.attachment,
    ipAddress: t.ipAddress,
    userAgent: t.userAgent,
    ratingComment: t.ratingComment,
    messages: t.messages.map((m) => ({
      id: m.id,
      kind: m.senderType,
      internal: m.isInternal,
      who: m.senderType === "support" ? m.senderName || "Поддержка" : m.senderName || (m.senderType === "bot" ? "Бот Lucky" : row.author),
      createdAt: m.createdAt,
      text: m.text,
      attachment: m.attachment ? { url: m.attachment, name: m.attachmentName || "Вложение" } : undefined,
    })),
    logs: t.logs,
    requesterTickets: t.requesterTickets.map((r) => ({ id: r.id, number: r.ticketNumber, subject: r.subject, status: r.status, createdAt: r.createdAt })),
  };
}

/** Filters as the query string of the queue endpoints: sets are comma-joined, flags are sent only when on. */
export const ticketQuery = (f: TicketFilters) => ({
  q: f.q,
  status: f.status?.join(","),
  priority: f.priority?.join(","),
  category: f.category?.join(","),
  source: f.source?.join(","),
  assignee: f.assignee,
  organizationId: f.organizationId,
  sla: f.sla,
  unread: f.unread ? "true" : undefined,
  awaiting: f.awaiting ? "true" : undefined,
  ordering: f.ordering,
});

/**
 * A reply template with its placeholders filled for this ticket. The operator gets plain text to edit
 * before sending; an unknown `{placeholder}` is left as written so a typo is visible.
 */
export function fillTemplate(text: string, ctx: { name: string; ticket: string; operator: string }) {
  const values: Record<string, string> = ctx;
  return (
    text
      .replace(/\{(\w+)\}/g, (whole, key: string) => (key in values ? values[key].trim() : whole))
      // A requester known only by contact has no name to greet by.
      .replace(/^(.+?), !/gm, "$1!")
  );
}
