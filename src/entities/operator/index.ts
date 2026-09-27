import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { api, QK } from "@/shared/api";
import type { IconName } from "@/shared/ui";

/* Bilimtrack team: platform admins and their privileges.
   Backend: server/apps/ops (PlatformOperator, use_cases/team.py), /api/v1/ops/team/, /ops/me/. */

/** OperatorSerializer (ops/team/, ops/me/). */
export type Operator = {
  id: number;
  username: string;
  email: string;
  fullName: string;
  lastName: string;
  firstName: string;
  middleName: string;
  avatar: string | null;
  role: string;
  roleLabel: string;
  permissions: string[];
  isActive: boolean;
  lastLogin: string | null;
  mustChangePassword: boolean;
  createdAt: string;
};

export type OpsPermission = { code: string; label: string };

/** Section → the privilege it needs (mirrors backend `OpsPermission`). */
export const PERMISSION_ICON: Record<string, IconName> = {
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

export const teamKeys = { list: [QK.team] as const, permissions: [QK.permissions] as const };

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
      qc.invalidateQueries({ queryKey: [QK.operators] });
    },
  });
}

export const useResetOperatorPassword = () =>
  useMutation({
    mutationFn: (id: number) => api<{ temporaryPassword: string }>(`ops/team/${id}/reset-password/`, { method: "POST", body: {} }),
  });
