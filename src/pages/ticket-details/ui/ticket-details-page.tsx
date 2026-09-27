import { Link, useParams } from "react-router";
import { ArrowLeft } from "lucide-react";
import { useOrganizationMap } from "@/entities/organization";
import { TicketPriorityBadge, TicketStatusBadge, useTicket } from "@/entities/ticket";
import { TicketControls } from "@/features/update-ticket";
import { routes } from "@/shared/config";
import { formatDateTime } from "@/shared/lib";
import { Card, CardHeader, EmptyState, Spinner } from "@/shared/ui";

export function TicketDetailsPage() {
  const { id = "" } = useParams();
  const { data: ticket, isPending, isError } = useTicket(id);
  const { data: orgs } = useOrganizationMap();

  const back = (
    <Link to={routes.tickets} className="mb-4 inline-flex items-center gap-1.5 text-sm text-fg-muted hover:text-fg">
      <ArrowLeft className="size-4" /> К списку тикетов
    </Link>
  );

  if (isPending) return <Spinner />;
  if (isError) return <>{back}<EmptyState title="Тикет не найден" /></>;

  const org = orgs?.get(ticket.organizationId);

  return (
    <>
      {back}
      <div className="mb-6">
        <p className="text-sm text-fg-subtle">{ticket.id}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">{ticket.title}</h1>
        <div className="mt-3 flex flex-wrap gap-2">
          <TicketStatusBadge status={ticket.status} />
          <TicketPriorityBadge priority={ticket.priority} />
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Описание" />
          <p className="p-5 text-sm leading-relaxed whitespace-pre-line">{ticket.description || "Описание не указано."}</p>
        </Card>
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader title="Управление" />
            <div className="p-5"><TicketControls ticket={ticket} /></div>
          </Card>
          <Card>
            <dl className="grid gap-3 p-5 text-sm">
              <div><dt className="text-fg-muted">Организация</dt><dd className="font-medium">{org?.name ?? "—"}</dd></div>
              <div><dt className="text-fg-muted">Контакт</dt><dd>{org?.contactName ?? "—"}</dd></div>
              <div><dt className="text-fg-muted">Создан</dt><dd>{formatDateTime(ticket.createdAt)}</dd></div>
              <div><dt className="text-fg-muted">Обновлён</dt><dd>{formatDateTime(ticket.updatedAt)}</dd></div>
            </dl>
          </Card>
        </div>
      </div>
    </>
  );
}
