import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import {
  CATEGORY,
  PRIORITY,
  PriorityPill,
  SOURCE,
  STATUS,
  SlaPill,
  useCloseTicket,
  useTicket,
  type Ticket,
} from "@/entities/ticket";
import { routes } from "@/shared/config";
import { formatDateTimeShort, formatRelative } from "@/shared/lib";
import { Avatar, Breadcrumbs, Button, Card, CardHeader, ErrorNote, Icon, StatusDot } from "@/shared/ui";
import { TicketThread } from "@/widgets/ticket-thread";

export function TicketDetailsPage() {
  const { id = "" } = useParams();
  const ticket = useTicket(Number(id));
  const close = useCloseTicket(ticket.id);

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
            <span>Обновлён {formatRelative(ticket.updatedAt)}</span>
            <span>·</span>
            <SlaPill sla={ticket.sla} prefix="SLA: " />
          </div>
        </div>
        {ticket.status !== "closed" && (
          <Button icon="check" disabled={close.isPending} onClick={() => close.mutate()}>
            {close.isPending ? "Закрываем…" : "Закрыть тикет"}
          </Button>
        )}
      </div>
      <ErrorNote error={close.error} />

      <div className="grid grid-cols-[minmax(0,1fr)_380px] items-start gap-4">
        <TicketThread key={ticket.id} ticket={ticket} />
        <ContextPanel ticket={ticket} />
      </div>
    </div>
  );
}

function ContextPanel({ ticket }: { ticket: Ticket }) {
  const [techOpen, setTechOpen] = useState(false);
  const navigate = useNavigate();
  const searchBy = ticket.contact || ticket.telegramUsername;
  const fields: [string, string][] = [
    ["Статус", STATUS[ticket.status].label],
    ["Приоритет", PRIORITY[ticket.priority].label],
    ["Категория", CATEGORY[ticket.category] ?? ticket.category],
    ["Источник", SOURCE[ticket.source].label],
    ["Контакт", ticket.contact || "—"],
    ["Исполнитель", ticket.assignee || "не назначен"],
  ];
  if (ticket.rating) fields.push(["Оценка", `${"★".repeat(ticket.rating)}${ticket.ratingComment ? ` · ${ticket.ratingComment}` : ""}`]);
  const details = ticket.errorDetails && Object.keys(ticket.errorDetails as object).length ? JSON.stringify(ticket.errorDetails, null, 2) : null;

  return (
    <Card className="overflow-hidden">
      <CardHeader title="Контекст" />
      <div className="flex flex-col gap-3.5 p-4">
        {ticket.hasAccount ? (
          <Link
            to={`${routes.accounts}?q=${encodeURIComponent(searchBy)}`}
            className="flex items-center gap-2.5 rounded-xl border border-neutral-200 p-2.5 text-ink hover:bg-neutral-50 hover:text-ink"
          >
            <Avatar icon="user" size={34} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-medium">{ticket.author}</div>
              <div className="text-[11px] text-neutral-400">Зарегистрированный пользователь · найти аккаунт</div>
            </div>
            <Icon name="arrow-up-right" size={16} className="text-brand" />
          </Link>
        ) : (
          <div className="flex flex-col gap-[9px] rounded-xl border border-amber-500 bg-amber-50 p-3">
            <div className="flex items-center gap-[7px] text-xs font-semibold text-amber-500">
              <Icon name="alert-triangle" size={16} />
              Автор не найден в системе
            </div>
            <div className="text-xs leading-[17px] text-neutral-700">
              Обращение без аккаунта ({SOURCE[ticket.source].label}). Известны {ticket.telegramUsername ? <b>@{ticket.telegramUsername}</b> : "имя"} и контакт из обращения.
            </div>
            {searchBy && (
              <Button size="sm" variant="primary" icon="user-search" onClick={() => navigate(`${routes.accounts}?q=${encodeURIComponent(searchBy)}`)}>
                Найти в поиске аккаунтов
              </Button>
            )}
          </div>
        )}
        {fields.map(([k, v]) => (
          <div key={k} className="flex items-center gap-2.5">
            <span className="w-[104px] shrink-0 text-xs text-neutral-400">{k}</span>
            <span className="min-w-0 flex-1 text-[13px] break-words">{v}</span>
          </div>
        ))}
        {ticket.description && ticket.messages[0]?.text !== ticket.description && (
          <div className="rounded-xl bg-neutral-50 p-3 text-[13px] leading-5 whitespace-pre-line text-neutral-700">{ticket.description}</div>
        )}
        <div className="border-t border-neutral-100 pt-3">
          <button onClick={() => setTechOpen((v) => !v)} className="flex items-center gap-2 border-0 bg-transparent p-0 text-[13px] font-medium">
            <Icon name={techOpen ? "chevron-down" : "chevron-right"} size={16} className="text-neutral-400" />
            Технические детали
            <span className="text-[11px] font-normal text-neutral-400">URL + контекст</span>
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
