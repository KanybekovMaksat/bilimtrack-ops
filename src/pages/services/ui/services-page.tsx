import { Card, PageHeader } from "@/shared/ui";
import { ServiceStatusBoard } from "@/widgets/service-status-board";

export function ServicesPage() {
  return (
    <>
      <PageHeader title="Сервисы" description="Состояние инфраструктуры, обновляется каждую минуту" />
      <Card>
        <ServiceStatusBoard />
      </Card>
    </>
  );
}
