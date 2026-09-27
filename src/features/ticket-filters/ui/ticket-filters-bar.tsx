import { Search } from "lucide-react";
import { useOrganizations } from "@/entities/organization";
import { ticketPriorities, ticketPriorityLabel, ticketStatuses, ticketStatusLabel } from "@/entities/ticket";
import { Button, Input, Select } from "@/shared/ui";
import { useTicketFilters } from "../model/use-ticket-filters";

export function TicketFiltersBar() {
  const { filters, setFilter, reset, isActive } = useTicketFilters();
  const { data: organizations = [] } = useOrganizations();

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-line p-4">
      <div className="relative min-w-56 flex-1">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-fg-subtle" />
        <Input className="pl-9" placeholder="Поиск по ID или теме" value={filters.search ?? ""} onChange={(e) => setFilter("q", e.target.value)} />
      </div>
      <Select className="w-auto" value={filters.status ?? ""} onChange={(e) => setFilter("status", e.target.value)} aria-label="Статус">
        <option value="">Все статусы</option>
        {ticketStatuses.map((s) => (
          <option key={s} value={s}>{ticketStatusLabel[s]}</option>
        ))}
      </Select>
      <Select className="w-auto" value={filters.priority ?? ""} onChange={(e) => setFilter("priority", e.target.value)} aria-label="Приоритет">
        <option value="">Любой приоритет</option>
        {ticketPriorities.map((p) => (
          <option key={p} value={p}>{ticketPriorityLabel[p]}</option>
        ))}
      </Select>
      <Select className="w-auto max-w-60" value={filters.organizationId ?? ""} onChange={(e) => setFilter("org", e.target.value)} aria-label="Организация">
        <option value="">Все организации</option>
        {organizations.map((o) => (
          <option key={o.id} value={o.id}>{o.name}</option>
        ))}
      </Select>
      {isActive && (
        <Button variant="ghost" size="sm" onClick={reset}>Сбросить</Button>
      )}
    </div>
  );
}
