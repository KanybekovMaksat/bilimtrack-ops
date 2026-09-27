import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useSession, type OperatorResponse } from "@/entities/session";
import { api, apiUpload } from "@/shared/api";

/* Bilimtrack team: platform admins and their privileges.
   Backend: server/apps/ops (PlatformOperator, use_cases/team.py), /api/v1/ops/team/, /ops/me/. */

export type Operator = OperatorResponse;

export type OpsPermission = { code: string; label: string };

/** Section → the privilege it needs (mirrors backend `OpsPermission`). */
export const PERMISSION_ICON: Record<string, string> = {
  sales: "inbox",
  support: "lifebuoy",
  organizations: "building",
  licenses: "toggle-right",
  accounts: "user-search",
  moderation: "shield-lock",
  tasks: "layout-kanban",
  content: "article",
  audit: "history",
  team: "users",
};

export const teamKeys = { list: ["ops-team"] as const, permissions: ["ops-permissions"] as const };

export const useTeam = () => useSuspenseQuery({ queryKey: teamKeys.list, queryFn: () => api<Operator[]>("ops/team/") }).data;

export const usePermissionCatalog = () =>
  useQuery({ queryKey: teamKeys.permissions, queryFn: () => api<OpsPermission[]>("ops/permissions/"), staleTime: 10 * 60_000 });

export type OperatorInput = {
  username?: string;
  email?: string;
  lastName?: string;
  firstName?: string;
  middleName?: string;
  password?: string;
  permissions?: string[];
  isActive?: boolean;
};

export function useCreateOperator() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: OperatorInput) => api<{ operator: Operator; temporaryPassword: string }>("ops/team/", { method: "POST", body: input }),
    onSuccess: () => qc.invalidateQueries({ queryKey: teamKeys.list }),
  });
}

export function useUpdateOperator() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: OperatorInput & { id: number }) => api<Operator>(`ops/team/${id}/`, { method: "PATCH", body: input }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: teamKeys.list });
      qc.invalidateQueries({ queryKey: ["ops-operators"] });
    },
  });
}

export const useResetOperatorPassword = () =>
  useMutation({
    mutationFn: (id: number) => api<{ temporaryPassword: string }>(`ops/team/${id}/reset-password/`, { method: "POST", body: {} }),
  });

/** Own profile: name and avatar. The session picks up the fresh operator. */
export function useUpdateMyProfile() {
  const setOperator = useSession((s) => s.setOperator);
  const qc = useQueryClient();
  const done = (me: Operator) => {
    setOperator(me);
    qc.invalidateQueries({ queryKey: teamKeys.list });
  };
  const names = useMutation({
    mutationFn: (input: { lastName: string; firstName: string; middleName: string }) =>
      api<Operator>("ops/me/profile/", { method: "PATCH", body: input }),
    onSuccess: done,
  });
  const avatar = useMutation({
    mutationFn: (file: File | null) => (file ? apiUpload<Operator>("ops/me/avatar/", file) : api<Operator>("ops/me/avatar/", { method: "DELETE" })),
    onSuccess: done,
  });
  return { names, avatar };
}
