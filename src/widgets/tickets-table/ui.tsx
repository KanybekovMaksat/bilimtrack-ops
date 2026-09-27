import { useNavigate } from "react-router";
import { CATEGORY, PriorityPill, SlaPill, SourceLabel, TicketStatusLabel, formatRelative, type Ticket } from "@/entities/ticket";
import { routes } from "@/shared/config";
import { Cell, Num, Row, Table } from "@/shared/ui";

const FULL = "118px minmax(260px,1fr) 170px 150px 100px 136px 104px 92px 96px";

/** The support inbox. Organization is not shown: the tickets API does not return it yet. */
export function TicketsTable({ tickets }: { tickets: Ticket[] }) {
  const navigate = useNavigate();
  return (
    <Table
      cols={FULL}
      minWidth={1260}
      head={["Номер", "Тема", "Автор", "Категория", "Приоритет", "SLA ответа", "Источник", "Статус", "Обновлён"]}
    >
      {tickets.map((t) => (
        <Row key={t.id} onClick={() => navigate(routes.ticket(t.id))}>
          <Num className="text-neutral-500">{t.number}</Num>
          <Cell className={t.status === "open" ? "font-medium" : undefined}>{t.subject}</Cell>
          <Cell className={t.hasAccount ? "text-brand" : "text-neutral-700"}>{t.author}</Cell>
          <Cell className="text-neutral-500">{CATEGORY[t.category] ?? t.category}</Cell>
          <span className="flex">
            <PriorityPill priority={t.priority} />
          </span>
          <span className="flex">
            <SlaPill sla={t.sla} />
          </span>
          <SourceLabel source={t.source} />
          <TicketStatusLabel status={t.status} />
          <span className="text-xs text-neutral-400">{formatRelative(t.updatedAt)}</span>
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
