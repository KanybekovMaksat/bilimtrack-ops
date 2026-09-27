import { useNavigate } from "react-router";
import {
  EscalationTag,
  PriorityPill,
  SlaPill,
  SourceLabel,
  TicketStatusLabel,
  useEscalations,
  type Ticket,
} from "@/entities/ticket";
import { routes } from "@/shared/config";
import { Cell, Num, OrgLabel, Row, Table } from "@/shared/ui";

const FULL = "110px minmax(240px,1fr) 130px 124px 108px 100px 124px 92px 92px 78px";

/** The support inbox table with SLA, source and escalation markers. */
export function TicketsTable({ tickets }: { tickets: Ticket[] }) {
  const navigate = useNavigate();
  const escalations = useEscalations((s) => s.byTicket);

  return (
    <Table
      cols={FULL}
      minWidth={1290}
      head={["Номер", "Тема", "Автор", "Организация", "Категория", "Приоритет", "SLA ответа", "Источник", "Статус", "Обновлён"]}
    >
      {tickets.map((t) => (
        <Row key={t.id} onClick={() => navigate(routes.ticket(t.id))}>
          <Num className="text-neutral-500">{t.id}</Num>
          <span className="flex min-w-0 items-center gap-1.5">
            <Cell className={t.unread ? "font-medium" : undefined}>{t.subject}</Cell>
            {escalations[t.id] && <EscalationTag taskKey={escalations[t.id]} />}
          </span>
          <Cell className="text-brand">{t.author}</Cell>
          <OrgLabel short={t.orgShort} name={t.org} />
          <Cell className="text-neutral-500">{t.category}</Cell>
          <span className="flex">
            <PriorityPill priority={t.priority} />
          </span>
          <span className="flex">
            <SlaPill sla={t.sla} />
          </span>
          <SourceLabel source={t.source} />
          <TicketStatusLabel status={t.status} />
          <span className="text-xs text-neutral-400">{t.updated}</span>
        </Row>
      ))}
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
          <Num className="text-neutral-500">{t.id}</Num>
          <Cell>{t.subject}</Cell>
          <span className="text-brand">{t.author}</span>
          <span className="text-xs text-neutral-700">{t.org}</span>
          <span>
            <PriorityPill priority={t.priority} />
          </span>
          <TicketStatusLabel status={t.status} />
        </Row>
      ))}
    </>
  );
}
