import { Link } from "react-router";
import { EmployeeChip, useEmployeeMap } from "@/entities/employee";
import { useOrganizationMap } from "@/entities/organization";
import { TicketPriorityBadge, TicketStatusBadge, useTickets, type TicketFilters } from "@/entities/ticket";
import { routes } from "@/shared/config";
import { formatRelative } from "@/shared/lib";
import { EmptyState, Spinner } from "@/shared/ui";

type TicketsTableProps = { filters?: TicketFilters; limit?: number };

export function TicketsTable({ filters = {}, limit }: TicketsTableProps) {
  const { data: tickets, isPending, isError } = useTickets(filters);
  const { data: orgs } = useOrganizationMap();
  const { data: employees } = useEmployeeMap();

  if (isPending) return <Spinner />;
  if (isError) return <EmptyState title="Не удалось загрузить тикеты" />;
  if (tickets.length === 0) return <EmptyState title="Тикетов нет" description="Попробуйте изменить фильтры." />;

  const rows = limit ? tickets.slice(0, limit) : tickets;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-left text-xs text-fg-muted">
          <tr className="border-b border-line">
            <th className="px-5 py-3 font-medium">Тикет</th>
            <th className="px-5 py-3 font-medium">Организация</th>
            <th className="px-5 py-3 font-medium">Приоритет</th>
            <th className="px-5 py-3 font-medium">Статус</th>
            <th className="px-5 py-3 font-medium">Исполнитель</th>
            <th className="px-5 py-3 font-medium whitespace-nowrap">Создан</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((t) => (
            <tr key={t.id} className="border-b border-line last:border-0 hover:bg-muted/50">
              <td className="px-5 py-3">
                <Link to={routes.ticket(t.id)} className="font-medium hover:text-brand">
                  <span className="mr-2 text-fg-subtle">{t.id}</span>
                  {t.title}
                </Link>
              </td>
              <td className="px-5 py-3 text-fg-muted">{orgs?.get(t.organizationId)?.name ?? "—"}</td>
              <td className="px-5 py-3"><TicketPriorityBadge priority={t.priority} /></td>
              <td className="px-5 py-3"><TicketStatusBadge status={t.status} /></td>
              <td className="px-5 py-3 whitespace-nowrap">
                <EmployeeChip employee={t.assigneeId ? employees?.get(t.assigneeId) : undefined} />
              </td>
              <td className="px-5 py-3 whitespace-nowrap text-fg-muted">{formatRelative(t.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
