import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { devTask, PriorityPill, SlaPill, STATUS, useEscalations, useTicket, type Ticket, type TicketDetail } from "@/entities/ticket";
import { EscalateTicketButton } from "@/features/escalate-ticket";
import { routes } from "@/shared/config";
import { Avatar, Breadcrumbs, Button, Card, EmptyState, Icon, SectionLabel, StatusDot, Tabs } from "@/shared/ui";
import { TicketThread } from "@/widgets/ticket-thread";

export function TicketDetailsPage() {
  const { id = "" } = useParams();
  const data = useTicket(id);
  const escalation = useEscalations((s) => s.byTicket[id]);
  const navigate = useNavigate();

  if (!data) {
    return (
      <EmptyState
        icon="lifebuoy"
        title="Тикет не найден"
        description={`Тикета ${id} нет в очереди.`}
        action={<Button onClick={() => navigate(routes.tickets)}>К списку тикетов</Button>}
      />
    );
  }

  const { ticket, detail } = data;
  const task = escalation ? devTask(escalation) : null;

  return (
    <div className="flex flex-col gap-3.5">
      <Breadcrumbs items={[{ label: "Тикеты", to: routes.tickets }, { label: ticket.id, numeric: true }]} />
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
            <span>Создан {detail.created}</span>
            <span>·</span>
            <span>Обновлён {ticket.updated}</span>
            <span>·</span>
            <SlaPill sla={ticket.sla} prefix="SLA: " />
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="primary" icon="player-play">
            Взять в работу
          </Button>
          {!escalation && <EscalateTicketButton ticket={ticket} />}
          <Button className="px-3.5">Решить</Button>
          <Button icon="dots" aria-label="Ещё" />
        </div>
      </div>

      {escalation && task && (
        <div className="flex items-center gap-2.5 rounded-xl border border-brand-100 bg-brand-50 px-3.5 py-[11px] text-[13px] leading-[18px]">
          <Icon name="git-pull-request" size={18} className="text-brand" />
          <span className="flex-1">
            Эскалировано в бэклог разработки:{" "}
            <Link to={routes.tasks} className="font-medium">
              {escalation} · {task.title}
            </Link>{" "}
            · статус задачи «{task.status}». Когда задачу закроют, тикет вернётся в очередь с пометкой.
          </span>
          <Link to={routes.tasks} className="flex items-center gap-1 text-xs font-medium">
            Открыть задачу
            <Icon name="arrow-up-right" size={14} />
          </Link>
        </div>
      )}

      <div className="grid grid-cols-[minmax(0,1fr)_380px] items-start gap-4">
        <TicketThread key={ticket.id} messages={detail.messages} />
        <div className="flex flex-col gap-3">
          <ContextPanel ticket={ticket} detail={detail} />
          <Card className="flex flex-col gap-2 px-4 py-3.5">
            <SectionLabel>Действия</SectionLabel>
            <div className="flex flex-wrap gap-1.5">
              {["Переназначить", "Сменить приоритет", "Сменить категорию", "Закрыть"].map((a) => (
                <Button key={a} size="xs">
                  {a}
                </Button>
              ))}
              <Button size="xs" variant="muted">
                Открыть повторно
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ContextPanel({ ticket, detail }: { ticket: Ticket; detail: TicketDetail }) {
  const [tab, setTab] = useState<"ctx" | "hist">("ctx");
  const [techOpen, setTechOpen] = useState(false);
  const navigate = useNavigate();
  const contact = detail.fields.find((f) => f.k === "Контакт")?.v ?? "";

  return (
    <Card className="overflow-hidden">
      <Tabs
        stretch
        value={tab}
        onChange={setTab}
        items={[
          { key: "ctx", label: "Контекст" },
          { key: "hist", label: "История" },
        ]}
      />
      {tab === "ctx" ? (
        <div className="flex flex-col gap-3.5 p-4">
          {detail.author ? (
            <Link
              to={routes.account("a.kaliyeva")}
              className="flex items-center gap-2.5 rounded-xl border border-neutral-200 p-2.5 text-ink hover:bg-neutral-50 hover:text-ink"
            >
              <Avatar initials={detail.author.initials} size={34} className="text-xs" />
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-medium">{detail.author.name}</div>
                <div className="text-[11px] text-neutral-400">{detail.author.role}</div>
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
                Тикет пришёл из Telegram-бота. Известны только ник <b>{detail.unknownAuthorNote ?? ticket.author}</b> и контакт из текста обращения.
              </div>
              <Button size="sm" variant="primary" icon="user-search" onClick={() => navigate(`${routes.accounts}?q=${encodeURIComponent(contact)}`)}>
                Найти в поиске аккаунтов
              </Button>
            </div>
          )}
          {detail.fields.map((f) => (
            <div key={f.k} className="flex items-center gap-2.5">
              <span className="w-[104px] shrink-0 text-xs text-neutral-400">{f.k}</span>
              <span className="flex-1 text-[13px]">{f.v}</span>
              {f.editable && <Icon name="chevron-down" size={15} className="text-neutral-400" />}
            </div>
          ))}
          <div className="border-t border-neutral-100 pt-3">
            <button onClick={() => setTechOpen((v) => !v)} className="flex items-center gap-2 border-0 bg-transparent p-0 text-[13px] font-medium">
              <Icon name={techOpen ? "chevron-down" : "chevron-right"} size={16} className="text-neutral-400" />
              Технические детали
              <span className="text-[11px] font-normal text-neutral-400">URL + контекст</span>
            </button>
            {techOpen && (
              <div className="mt-2.5 flex flex-col gap-2">
                <div className="text-[11px] text-neutral-400">Страница с ошибкой</div>
                {detail.url === "—" ? (
                  <span className="text-xs">—</span>
                ) : (
                  <a href={detail.url} target="_blank" rel="noreferrer" className="font-num text-xs break-all">
                    {detail.url}
                  </a>
                )}
                <div className="text-[11px] text-neutral-400">Технический контекст</div>
                <pre className="m-0 max-h-[180px] overflow-auto rounded-[10px] border border-neutral-100 bg-neutral-50 p-2.5 font-mono text-[11px] leading-4 text-neutral-700">
                  {detail.techContext}
                </pre>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="px-4 pt-2 pb-4">
          {detail.history.map((h) => (
            <div key={h.text + h.time} className="flex gap-2.5 border-b border-neutral-50 py-[9px] last:border-b-0">
              <Icon name="point" size={16} className="text-neutral-300" />
              <div className="flex-1">
                <div className="text-xs leading-[17px]">{h.text}</div>
                <div className="text-[11px] text-neutral-400">
                  {h.who} · {h.time}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
