import { useNavigate } from "react-router";
import { CreateOrganizationWizard } from "@/features/create-organization";
import { routes } from "@/shared/config";
import { Breadcrumbs, PageTitle } from "@/shared/ui";

export function OrgNewPage() {
  const navigate = useNavigate();
  return (
    <div className="mx-auto flex max-w-[920px] flex-col gap-[22px]">
      <Breadcrumbs items={[{ label: "Организации", to: routes.orgs }, { label: "Новая организация" }]} />
      <PageTitle>Новая организация</PageTitle>
      <CreateOrganizationWizard onDone={(id) => navigate(routes.org(id))} />
    </div>
  );
}
