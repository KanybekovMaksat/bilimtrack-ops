import { Card, PageHeader } from "@/shared/ui";
import { OrganizationsTable } from "@/widgets/organizations-table";

export function OrganizationsPage() {
  return (
    <>
      <PageHeader title="Организации" description="Учебные заведения — клиенты Bilimtrack" />
      <Card>
        <OrganizationsTable />
      </Card>
    </>
  );
}
