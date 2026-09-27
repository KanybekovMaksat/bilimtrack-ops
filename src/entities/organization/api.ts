import { keepPreviousData, useMutation, useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { api, apiList } from "@/shared/api";
import type { OrgMember, OrgStatus, Organization, OrganizationDetail } from "./model";

export const orgKeys = {
  all: ["orgs"] as const,
  detail: (id: number) => ["orgs", id] as const,
  members: (id: number, q: string) => ["orgs", id, "members", q] as const,
};

/** Every organization (the platform has dozens, not thousands): the list filters on the client. */
export const useOrganizations = () =>
  useSuspenseQuery({ queryKey: orgKeys.all, queryFn: () => apiList<Organization>("ops/organizations/") }).data;

/** Non-suspending variant for selects and counters. */
export const useOrganizationsSoft = () => useQuery({ queryKey: orgKeys.all, queryFn: () => apiList<Organization>("ops/organizations/") });

export const useOrganization = (id: number) =>
  useSuspenseQuery({ queryKey: orgKeys.detail(id), queryFn: () => api<OrganizationDetail>(`ops/organizations/${id}/`) }).data;

export const useOrgMembers = (id: number, q: string) =>
  useQuery({
    queryKey: orgKeys.members(id, q),
    queryFn: () => apiList<OrgMember>(`ops/organizations/${id}/members/`, { q }),
    placeholderData: keepPreviousData,
  });

/** Every organization change answers with the fresh card; lists and licenses are refetched. */
function useOrgMutation<V>(id: number, request: (v: V) => Promise<OrganizationDetail>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: request,
    onSuccess: (detail) => {
      qc.setQueryData(orgKeys.detail(id), detail);
      qc.invalidateQueries({ queryKey: orgKeys.all, exact: true });
      qc.invalidateQueries({ queryKey: ["licenses"] });
    },
  });
}

export const useSetOrgStatus = (id: number) =>
  useOrgMutation(id, (status: OrgStatus) => api<OrganizationDetail>(`ops/organizations/${id}/`, { method: "PATCH", body: { status } }));

export const useSetOrgModules = (id: number) =>
  useOrgMutation(id, (modules: Record<string, boolean>) =>
    api<OrganizationDetail>(`ops/organizations/${id}/modules/`, { method: "PATCH", body: { modules } }),
  );

export const useSetOrgSettings = (id: number) =>
  useOrgMutation(id, (settings: Record<string, boolean>) =>
    api<OrganizationDetail>(`ops/organizations/${id}/settings/`, { method: "PATCH", body: { settings } }),
  );
