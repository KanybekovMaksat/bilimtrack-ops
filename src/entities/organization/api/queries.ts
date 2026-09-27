import { useQuery } from "@tanstack/react-query";
import { organizationApi } from "./organization-api";

export const organizationKeys = {
  all: ["organizations"] as const,
  detail: (id: string) => ["organizations", id] as const,
};

export const useOrganizations = () =>
  useQuery({ queryKey: organizationKeys.all, queryFn: organizationApi.list });

/** Lookup map for rendering organization names next to other entities. */
export const useOrganizationMap = () =>
  useQuery({
    queryKey: organizationKeys.all,
    queryFn: organizationApi.list,
    select: (list) => new Map(list.map((o) => [o.id, o])),
  });
