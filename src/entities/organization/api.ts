import { useMockQuery } from "@/shared/api";
import { ORGANIZATIONS, orgDetail } from "./model";

export const useOrganizations = () => useMockQuery(["orgs"], () => ORGANIZATIONS);

export const useOrganization = (slug: string) =>
  useMockQuery(["orgs", slug], () => {
    const org = ORGANIZATIONS.find((o) => o.slug === slug) ?? ORGANIZATIONS[0];
    return { org, detail: orgDetail(org.slug) };
  });
