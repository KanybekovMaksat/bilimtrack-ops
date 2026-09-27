import { keepPreviousData, useMutation, useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { api, apiList, apiUpload, QK } from "@/shared/api";
import type {
  Credentials,
  OrgMember,
  OrgRole,
  OrgStatus,
  Organization,
  OrganizationCreateInput,
  OrganizationDetail,
  OrganizationInput,
  PersonCreated,
  PersonInput,
  PlatformSummary,
} from "./model";

export const orgKeys = {
  all: [QK.orgs] as const,
  detail: (id: number) => [QK.orgs, id] as const,
  members: (id: number, q: string) => [QK.orgs, id, "members", q] as const,
  roles: (id: number) => [QK.orgs, id, "roles"] as const,
  summary: [QK.platformSummary] as const,
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
      qc.invalidateQueries({ queryKey: orgKeys.summary });
      qc.invalidateQueries({ queryKey: [QK.licenses] });
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

export const useUpdateOrganization = (id: number) =>
  useOrgMutation(id, (input: OrganizationInput) => api<OrganizationDetail>(`ops/organizations/${id}/`, { method: "PATCH", body: input }));

export const useSetOrgLogo = (id: number) =>
  useOrgMutation(id, (file: File | null) =>
    file ? apiUpload<OrganizationDetail>(`ops/organizations/${id}/logo/`, file) : api<OrganizationDetail>(`ops/organizations/${id}/logo/`, { method: "DELETE" }),
  );

/** POST ops/organizations/: the answer carries the owner's one-time password when a new owner was created. */
export function useCreateOrganization() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: OrganizationCreateInput) =>
      api<OrganizationDetail & { ownerCredentials?: Credentials | null }>("ops/organizations/", { method: "POST", body: input }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: orgKeys.all, exact: true });
      qc.invalidateQueries({ queryKey: orgKeys.summary });
      qc.invalidateQueries({ queryKey: [QK.licenses] });
    },
  });
}

export function useDeleteOrganization(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (confirm: string) => api(`ops/organizations/${id}/`, { method: "DELETE", body: { confirm } }),
    onSuccess: () => {
      qc.removeQueries({ queryKey: orgKeys.detail(id) });
      qc.invalidateQueries({ queryKey: orgKeys.all, exact: true });
      qc.invalidateQueries({ queryKey: orgKeys.summary });
      qc.invalidateQueries({ queryKey: [QK.licenses] });
    },
  });
}

export const useOrgRoles = (id: number) =>
  useQuery({ queryKey: orgKeys.roles(id), queryFn: () => api<OrgRole[]>(`ops/organizations/${id}/roles/`), staleTime: 5 * 60_000 });

export function useAddPerson(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: PersonInput) => api<PersonCreated>(`ops/organizations/${id}/people/`, { method: "POST", body: input }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QK.orgs, id] });
      qc.invalidateQueries({ queryKey: [QK.accounts] });
      qc.invalidateQueries({ queryKey: orgKeys.summary });
    },
  });
}

export function useUpdateMembership(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ membershipId, ...input }: { membershipId: number; roleIds?: number[]; status?: "active" | "suspended" }) =>
      api<OrgMember>(`ops/organizations/${id}/members/${membershipId}/`, { method: "PATCH", body: input }),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QK.orgs, id, "members"] }),
  });
}

export const usePlatformSummary = () =>
  useQuery({ queryKey: orgKeys.summary, queryFn: () => api<PlatformSummary>("ops/summary/"), retry: false });
