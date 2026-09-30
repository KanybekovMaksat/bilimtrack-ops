import { useNavigate } from "react-router";
import { CATEGORY, PriorityPill, SlaPill, SOURCE, TicketStatusLabel, type Ticket } from "@/entities/ticket";
import { routes } from "@/shared/config";
import { cn, formatRelative } from "@/shared/lib";
import { Cell, Icon, Num, Row, Table } from "@/shared/ui";

const FULL = "126px minmax(280px,1fr) 190px 140px 100px 136px 150px 92px 92px";

/** Server ordering keys of the inbox columns (`ORDERING` in the backend's use_cases/helpdesk.py). */
const SORT_KEYS = ["number", "subject", "author", "category", "priority", undefined, undefined, "status", "updated"];

type TicketsTableProps = { tickets: Ticket[]; loading?: boolean; sort?: string; onSort?: (sort: string | undefined) => void };

/**
 * The support inbox. An unread ticket (the requester wrote, nobody on the team opened it) is bold with a dot;
 * under the subject is the last message, so the queue reads like a mail list.
 */
export function TicketsTable({ tickets, loading, sort, onSort }: TicketsTableProps) {
  const navigate = useNavigate();
  return (
    <Table
      cols={FULL}
      minWidth={1300}
      head={["Номер", "Тема и последнее сообщение", "Автор", "Категория", "Приоритет", "SLA ответа", "Исполнитель", "Статус", "Активность"]}
      sortKeys={SORT_KEYS}
      sort={sort}
      onSort={onSort}
    >
      {tickets.map((t) => {
        const source = SOURCE[t.source] ?? SOURCE.api;
        return (
          <Row key={t.id} onClick={() => navigate(routes.ticket(t.id))} className={t.unread ? "bg-brand-50/40" : undefined}>
            <span className="flex min-w-0 items-center gap-2">
              <span className={cn("size-2 shrink-0 rounded-full", t.unread ? "bg-brand" : "bg-transparent")} title={t.unread ? "Есть непрочитанное сообщение" : undefined} />
              <Num className={t.unread ? "font-semibold text-ink" : "text-neutral-500"}>{t.number}</Num>
            </span>
            <span className="min-w-0">
              <Cell className={cn("block", t.unread && "font-semibold")}>{t.subject}</Cell>
              <span className="flex min-w-0 items-center gap-1.5 text-xs text-neutral-500">
                {t.awaitingReply && <span className="shrink-0 rounded-full bg-amber-50 px-1.5 text-[11px] font-medium text-warn">ждёт ответа</span>}
                <Cell>
                  {t.lastMessageBy === "support" && <span className="text-neutral-400">Поддержка: </span>}
                  {t.lastMessagePreview || "—"}
                </Cell>
              </span>
            </span>
            <span className="min-w-0">
              <span className="flex min-w-0 items-center gap-1.5">
                <span title={source.label} className="flex shrink-0">
                  <Icon name={source.icon} size={14} style={{ color: source.color }} />
                </span>
                <Cell className={t.hasAccount ? "text-brand" : "text-neutral-700"}>{t.author}</Cell>
              </span>
              <Cell className="block text-[11px] text-neutral-400">{t.organization?.name ?? (t.hasAccount ? "без организации" : "гость")}</Cell>
            </span>
            <Cell className="text-neutral-500">{CATEGORY[t.category] ?? t.category}</Cell>
            <span className="flex">
              <PriorityPill priority={t.priority} />
            </span>
            <span className="flex">
              <SlaPill sla={t.sla} />
            </span>
            <Cell className={t.assignee ? "text-xs text-neutral-700" : "text-xs text-neutral-400"}>{t.assignee?.name ?? "не назначен"}</Cell>
            <TicketStatusLabel status={t.status} />
            <span className="text-xs text-neutral-400">{formatRelative(t.lastMessageAt)}</span>
          </Row>
        );
      })}
      {loading && <div className="h-40 animate-pulse bg-neutral-50" />}
    </Table>
  );
}

/** Shorter variant used on the "list states" reference screen. */
export function CompactTicketRows({ tickets }: { tickets: Ticket[] }) {
  const navigate = useNavigate();
  return (
    <>
      {tickets.map((t) => (
        <Row key={t.id} onClick={() => navigate(routes.ticket(t.id))}>
          <Num className="text-neutral-500">{t.number}</Num>
          <Cell>{t.subject}</Cell>
          <Cell className="text-brand">{t.author}</Cell>
          <Cell className="text-xs text-neutral-700">{CATEGORY[t.category] ?? t.category}</Cell>
          <span>
            <PriorityPill priority={t.priority} />
          </span>
          <TicketStatusLabel status={t.status} />
        </Row>
      ))}
    </>
  );
}
