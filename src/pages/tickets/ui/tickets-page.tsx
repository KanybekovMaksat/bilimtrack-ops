import { CreateTicketButton } from "@/features/create-ticket";
import { TicketFiltersBar, useTicketFilters } from "@/features/ticket-filters";
import { Card, PageHeader } from "@/shared/ui";
import { TicketsTable } from "@/widgets/tickets-table";

export function TicketsPage() {
  const { filters } = useTicketFilters();

  return (
    <>
      <PageHeader title="Тикеты" description="Обращения клиентов в поддержку" actions={<CreateTicketButton />} />
      <Card>
        <TicketFiltersBar />
        <TicketsTable filters={filters} />
      </Card>
    </>
  );
}
