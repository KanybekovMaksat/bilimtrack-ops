import { useEffect, useEffectEvent, useState, type ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useCan, useSession } from "@/entities/session";
import { operatorOptions, useOperators } from "@/entities/task";
import {
  CATEGORY,
  LOG_ACTION,
  PRIORITY,
  PriorityPill,
  SOURCE,
  STATUS,
  SlaPill,
  TicketStatusLabel,
  useMarkTicketRead,
  useTicket,
  useUpdateTicket,
  type TicketCategory,
  type TicketDetail,
  type TicketLog,
  type TicketPriority,
  type TicketStatus,
  type TicketUpdate,
} from "@/entities/ticket";
import { routes } from "@/shared/config";
import { formatDateTimeShort, formatRelative } from "@/shared/lib";
import { Avatar, Breadcrumbs, Button, Card, CardHeader, Dropdown, EmptyState, ErrorNote, Icon, StatusDot } from "@/shared/ui";
import { TicketThread } from "@/widgets/ticket-thread";

const STATUSES = Object.keys(STATUS) as TicketStatus[];
const PRIORITIES = Object.keys(PRIORITY) as TicketPriority[];
const CATEGORIES = Object.keys(CATEGORY) as TicketCategory[];

export function TicketDetailsPage() {
  const { id = "" } = useParams();
  const ticketId = Number(id);
  if (!Number.isInteger(ticketId) || ticketId <= 0) return <EmptyState icon="inbox-off" title="Тикет не найден" description="Проверьте ссылку или вернитесь в список." />;
  return <TicketView key={ticketId} id={ticketId} />;
}

function TicketView({ id }: { id: number }) {
  const ticket = useTicket(id);
  const me = useSession((s) => s.user);
  const can = useCan();
  const navigate = useNavigate();
  const update = useUpdateTicket(id);
  const read = useMarkTicketRead(id);

  // An open ticket counts as seen by the team: on entry and every time the poll brings a new message.
  const markRead = useEffectEvent(() => {
    if (!read.isPending) read.mutate(false);
  });
  useEffect(() => {
    if (ticket.unread) markRead();
  }, [ticket.unread, ticket.lastMessageAt]);

  const mine = ticket.assignee?.id != null && ticket.assignee.id === me?.id;
  const done = ticket.status === "resolved" || ticket.status === "closed";
  const canEdit = can("support");
  const change = (patch: TicketUpdate) => update.mutate(patch);

  return (
    <div className="flex flex-col gap-3.5">
      <Breadcrumbs items={[{ label: "Тикеты", to: routes.tickets }, { label: ticket.number, numeric: true }]} />
      <div className="flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="m-0 mb-1.5 text-xl leading-[26px] font-semibold tracking-[-.01em]">{ticket.subject}</h1>
          <div className="flex flex-wrap items-center gap-2.5 text-xs text-neutral-500">
            <StatusDot color={STATUS[ticket.status].color} className="text-neutral-500">
              {STATUS[ticket.status].label}
            </StatusDot>
            <span>·</span>
            <PriorityPill priority={ticket.priority} compact />
            <span>·</span>
            <span>Создан {formatDateTimeShort(ticket.createdAt)}</span>
            <span>·</span>
            <span>Активность {formatRelative(ticket.lastMessageAt)}</span>
            <span>·</span>
            <SlaPill sla={ticket.sla} prefix="SLA: " />
            {ticket.awaitingReply && <span className="rounded-full bg-amber-50 px-2 py-0.5 font-medium text-warn">ждёт ответа</span>}
          </div>
        </div>
        {canEdit && (
          <div className="flex shrink-0 items-center gap-2">
            <Button
              variant="ghost"
              icon="mail"
              title="Вернуть в непрочитанные и выйти в список"
              aria-label="Отметить непрочитанным"
              disabled={read.isPending}
              // Leaving first: staying on the page would mark the ticket read again.
              onClick={() => read.mutate(true, { onSuccess: () => navigate(routes.tickets) })}
            />
            {!mine && !done && me && (
              <Button icon="user" disabled={update.isPending} onClick={() => change({ assigneeId: me.id, ...(ticket.status === "open" ? { status: "in_progress" as const } : {}) })}>
                Взять себе
              </Button>
            )}
            {done ? (
              <Button icon="refresh" disabled={update.isPending} onClick={() => change({ status: "in_progress" })}>
                Открыть заново
              </Button>
            ) : (
              <>
                <Button icon="circle-check" disabled={update.isPending} onClick={() => change({ status: "resolved" })}>
                  Решён
                </Button>
                <Button icon="check" disabled={update.isPending} onClick={() => change({ status: "closed" })}>
                  Закрыть
                </Button>
              </>
            )}
          </div>
        )}
      </div>
      <ErrorNote error={update.error ?? read.error} />

      <div className="grid grid-cols-[minmax(0,1fr)_380px] items-start gap-4">
        <TicketThread ticket={ticket} />
        <div className="flex flex-col gap-4">
          <ContextPanel ticket={ticket} canEdit={canEdit} onChange={change} />
          <HistoryPanel logs={ticket.logs} />
        </div>
      </div>
    </div>
  );
}

function FieldRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="w-[104px] shrink-0 text-xs text-neutral-400">{label}</span>
      <span className="min-w-0 flex-1 text-[13px] break-words">{children}</span>
    </div>
  );
}

type ContextProps = { ticket: TicketDetail; canEdit: boolean; onChange: (patch: TicketUpdate) => void };

function ContextPanel({ ticket, canEdit, onChange }: ContextProps) {
  const [techOpen, setTechOpen] = useState(false);
  const operators = useOperators().data ?? [];
  const searchBy = ticket.contact || ticket.telegramUsername;
  const details = ticket.errorDetails && Object.keys(ticket.errorDetails as object).length ? JSON.stringify(ticket.errorDetails, null, 2) : null;

  return (
    <Card className="overflow-hidden">
      <CardHeader title="Контекст" />
      <div className="flex flex-col gap-3 p-4">
        {ticket.hasAccount ? (
          <Link
            to={ticket.username ? routes.account(ticket.username) : `${routes.accounts}?q=${encodeURIComponent(searchBy)}`}
            className="flex items-center gap-2.5 rounded-xl border border-neutral-200 p-2.5 text-ink hover:bg-neutral-50 hover:text-ink"
          >
            <Avatar icon="user" size={34} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-medium">{ticket.author}</div>
              <div className="truncate font-num text-[11px] text-neutral-400">{ticket.username ?? "зарегистрированный пользователь"}</div>
            </div>
            <Icon name="arrow-up-right" size={16} className="text-brand" />
          </Link>
        ) : (
          <div className="flex flex-col gap-[9px] rounded-xl border border-amber-500 bg-amber-50 p-3">
            <div className="flex items-center gap-[7px] text-xs font-semibold text-amber-500">
              <Icon name="alert-triangle" size={16} />
              Обращение без аккаунта
            </div>
            <div className="text-xs leading-[17px] text-neutral-700">
              {ticket.author} · {SOURCE[ticket.source].label}. Известны {ticket.telegramUsername ? <b>@{ticket.telegramUsername}</b> : "имя"} и контакт из обращения.
            </div>
            {searchBy && (
              <Link to={`${routes.accounts}?q=${encodeURIComponent(searchBy)}`} className="flex items-center gap-1.5 text-xs font-medium">
                <Icon name="user-search" size={15} />
                Найти в поиске аккаунтов
              </Link>
            )}
          </div>
        )}

        {canEdit ? (
          <>
            <FieldRow label="Статус">
              <Dropdown<TicketStatus>
                value={ticket.status}
                onChange={(s) => s && s !== ticket.status && onChange({ status: s })}
                placeholder="Статус"
                options={STATUSES.map((s) => ({ value: s, label: STATUS[s].label, dot: STATUS[s].color }))}
              />
            </FieldRow>
            <FieldRow label="Исполнитель">
              <Dropdown<string>
                clearable
                searchable
                searchPlaceholder="Имя или логин"
                placeholder="Не назначен"
                value={ticket.assignee?.id != null ? String(ticket.assignee.id) : null}
                onChange={(v) => onChange({ assigneeId: v ? Number(v) : null })}
                options={operatorOptions(operators)}
              />
              {ticket.assignee && ticket.assignee.id === null && <div className="mt-1 text-[11px] text-neutral-400">Из Telegram-группы: {ticket.assignee.name}</div>}
            </FieldRow>
            <FieldRow label="Приоритет">
              <Dropdown<TicketPriority>
                value={ticket.priority}
                onChange={(p) => p && p !== ticket.priority && onChange({ priority: p })}
                placeholder="Приоритет"
                options={PRIORITIES.map((p) => ({ value: p, label: PRIORITY[p].label }))}
              />
            </FieldRow>
            <FieldRow label="Категория">
              <Dropdown<TicketCategory>
                value={ticket.category}
                onChange={(c) => c && c !== ticket.category && onChange({ category: c })}
                placeholder="Категория"
                options={CATEGORIES.map((c) => ({ value: c, label: CATEGORY[c] }))}
              />
            </FieldRow>
          </>
        ) : (
          <>
            <FieldRow label="Статус">{STATUS[ticket.status].label}</FieldRow>
            <FieldRow label="Исполнитель">{ticket.assignee?.name ?? "не назначен"}</FieldRow>
            <FieldRow label="Приоритет">{PRIORITY[ticket.priority].label}</FieldRow>
            <FieldRow label="Категория">{CATEGORY[ticket.category] ?? ticket.category}</FieldRow>
          </>
        )}
        <FieldRow label="Источник">{SOURCE[ticket.source].label}</FieldRow>
        <FieldRow label="Организация">{ticket.organization ? <Link to={routes.org(ticket.organization.id)}>{ticket.organization.name}</Link> : "—"}</FieldRow>
        <FieldRow label="Контакт">{ticket.contact || "—"}</FieldRow>
        {ticket.rating && (
          <FieldRow label="Оценка">
            {"★".repeat(ticket.rating)}
            {ticket.ratingComment ? ` · ${ticket.ratingComment}` : ""}
          </FieldRow>
        )}

        {ticket.description && ticket.messages[0]?.text !== ticket.description && (
          <div className="rounded-xl bg-neutral-50 p-3 text-[13px] leading-5 whitespace-pre-line text-neutral-700">{ticket.description}</div>
        )}
        {ticket.attachment && (
          <a href={ticket.attachment} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs">
            <Icon name="paperclip" size={14} />
            Вложение к обращению
          </a>
        )}

        {ticket.requesterTickets.length > 0 && (
          <div className="border-t border-neutral-100 pt-3">
            <div className="mb-1.5 text-xs font-semibold text-neutral-500">Другие обращения автора · {ticket.requesterTickets.length}</div>
            <div className="flex flex-col gap-1">
              {ticket.requesterTickets.map((t) => (
                <Link key={t.id} to={routes.ticket(t.id)} className="flex items-center gap-2 rounded-lg px-1.5 py-1 text-ink hover:bg-neutral-50 hover:text-ink">
                  <span className="min-w-0 flex-1 truncate text-xs">{t.subject}</span>
                  <TicketStatusLabel status={t.status} className="shrink-0 text-[11px] text-neutral-500" />
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="border-t border-neutral-100 pt-3">
          <button onClick={() => setTechOpen((v) => !v)} className="flex items-center gap-2 border-0 bg-transparent p-0 text-[13px] font-medium">
            <Icon name={techOpen ? "chevron-down" : "chevron-right"} size={16} className="text-neutral-400" />
            Технические детали
            <span className="text-[11px] font-normal text-neutral-400">URL, устройство, контекст</span>
          </button>
          {techOpen && (
            <div className="mt-2.5 flex flex-col gap-2">
              <div className="text-[11px] text-neutral-400">Страница с ошибкой</div>
              {ticket.pageUrl ? (
                <a href={ticket.pageUrl} target="_blank" rel="noreferrer" className="font-num text-xs break-all">
                  {ticket.pageUrl}
                </a>
              ) : (
                <span className="text-xs">—</span>
              )}
              <div className="text-[11px] text-neutral-400">IP и устройство</div>
              <span className="font-num text-xs break-all text-neutral-700">{[ticket.ipAddress, ticket.userAgent].filter(Boolean).join(" · ") || "—"}</span>
              <div className="text-[11px] text-neutral-400">Технический контекст</div>
              <pre className="m-0 max-h-[180px] overflow-auto rounded-[10px] border border-neutral-100 bg-neutral-50 p-2.5 font-mono text-[11px] leading-4 text-neutral-700">
                {details ?? "Клиент не прислал технических данных"}
              </pre>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

const asText = (v: unknown) => (typeof v === "string" ? v : "");

/** What changed, in words: «Открыто → В работе», «приоритет: Обычный → Высокий». */
function logDetails(log: TicketLog): string {
  const d = log.details ?? {};
  if (log.action === "status_changed" || log.action === "reopened" || log.action === "closed") {
    const from = asText(d.from) as TicketStatus;
    const to = asText(d.to) as TicketStatus;
    return to ? `${STATUS[from]?.label ?? from} → ${STATUS[to]?.label ?? to}` : "";
  }
  if (log.action === "assigned") return asText(d.assignee) || "исполнитель снят";
  if (log.action === "updated") {
    return Object.entries(d)
      .map(([field, change]) => {
        const { from, to } = (change ?? {}) as { from?: string; to?: string };
        const label = (v?: string) => (field === "priority" ? PRIORITY[v as TicketPriority]?.label : CATEGORY[v as TicketCategory]) ?? v ?? "";
        return `${field === "priority" ? "приоритет" : "категория"}: ${label(from)} → ${label(to)}`;
      })
      .join("; ");
  }
  return asText(d.text_preview) || asText(d.textPreview);
}

function HistoryPanel({ logs }: { logs: TicketLog[] }) {
  const [open, setOpen] = useState(false);
  if (!logs.length) return null;
  return (
    <Card className="overflow-hidden">
      <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center gap-2 border-0 bg-transparent px-4 py-3 text-left text-[13px] font-medium">
        <Icon name={open ? "chevron-down" : "chevron-right"} size={16} className="text-neutral-400" />
        История
        <span className="text-[11px] font-normal text-neutral-400">{logs.length}</span>
      </button>
      {open && (
        <div className="flex max-h-[320px] flex-col gap-2.5 overflow-auto border-t border-neutral-100 px-4 py-3">
          {logs.map((log) => {
            const details = logDetails(log);
            return (
              <div key={log.id} className="text-xs leading-[17px]">
                <span className="font-medium">{log.actorName || "Система"}</span> <span className="text-neutral-500">{LOG_ACTION[log.action] ?? log.action}</span>
                {details && <div className="break-words text-neutral-600">{details}</div>}
                <div className="text-[11px] text-neutral-400">{formatDateTimeShort(log.createdAt)}</div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
