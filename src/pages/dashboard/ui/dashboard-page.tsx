import { Link } from "react-router";
import { useSessionUser } from "@/entities/session";
import { routes } from "@/shared/config";
import { Card, CardHeader, PageHeader } from "@/shared/ui";
import { ServiceStatusBoard } from "@/widgets/service-status-board";
import { StatsOverview } from "@/widgets/stats-overview";
import { TicketsTable } from "@/widgets/tickets-table";

export function DashboardPage() {
  const user = useSessionUser();

  return (
    <>
      <PageHeader title={`Здравствуйте, ${user?.name ?? "коллега"}`} description="Операционная сводка по платформе Bilimtrack" />
      <StatsOverview />
      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Последние тикеты" action={<Link to={routes.tickets} className="text-sm text-brand hover:underline">Все тикеты</Link>} />
          <TicketsTable limit={6} />
        </Card>
        <Card>
          <CardHeader title="Сервисы" action={<Link to={routes.services} className="text-sm text-brand hover:underline">Подробнее</Link>} />
          <ServiceStatusBoard compact />
        </Card>
      </div>
    </>
  );
}
