import { keepPreviousData, useMutation, useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { api, apiAll, ApiError, apiPage, QK } from "@/shared/api";
import { formatDateLong } from "@/shared/lib";

/* Every login account on the platform.
   Registry: server/apps/ops (use_cases/accounts.py), /api/v1/ops/accounts/.
   Profile search + linking: server/apps/users (support_accounts), /api/v1/support/accounts/. */

export type ProfileType = "employee" | "learner" | "guardian";

export const profileTypeLabel: Record<ProfileType, string> = {
  employee: "Сотрудник",
  learner: "Учащийся",
  guardian: "Родитель",
};

export type OrgRef = { id: number; name: string };

export type Membership = {
  id: number;
  organization: OrgRef;
  status: string;
  isDefault: boolean;
  roles: { id: number; code: string; name: string }[];
};

export type Profile = {
  id: number;
  profileType: ProfileType;
  fullName: string;
  email: string;
  phone: string;
  organization: OrgRef;
  /** Account the profile is linked to; null — the person cannot sign in with it. */
  linkedUserId: number | null;
};

/** AccountSerializer (ops) — the resolver's shape plus registry fields. */
export type Account = {
  id: number;
  username: string;
  email: string;
  phone: string;
  isActive: boolean;
  lastLogin: string | null;
  dateJoined?: string;
  mustChangePassword?: boolean;
  emailVerifiedAt?: string | null;
  passwordChangedAt?: string | null;
  operator?: { fullName: string; role: string; roleLabel: string; isActive: boolean } | null;
  memberships: Membership[];
  profiles: Profile[];
};

export type AccountSearch = { accounts: Account[]; profiles: Profile[] };

export type AccountKind = "employee" | "learner" | "guardian" | "operator" | "no_membership";

export const accountKindLabel: Record<AccountKind, string> = {
  employee: "Сотрудники",
  learner: "Учащиеся",
  guardian: "Родители",
  operator: "Команда Bilimtrack",
  no_membership: "Без организации",
};

export type AccountFilters = {
  q?: string;
  organizationId?: number;
  status?: "active" | "inactive";
  kind?: AccountKind;
  neverLoggedIn?: boolean;
  page?: number;
};

export const ACCOUNTS_PAGE_SIZE = 50;

export const accountKeys = {
  list: (f: AccountFilters) => [QK.accounts, "list", f] as const,
  byUsername: (username: string) => [QK.accounts, "by-username", username] as const,
  search: (q: string) => [QK.accountSearch, q] as const,
};

const accountQuery = (f: AccountFilters) => ({
  q: f.q,
  organizationId: f.organizationId,
  status: f.status,
  kind: f.kind,
  neverLoggedIn: f.neverLoggedIn ? "true" : undefined,
});

/** Every account of the selection (no paging) for the CSV export. */
export const exportAccounts = (f: Omit<AccountFilters, "page">) => apiAll<Account>("ops/accounts/", accountQuery(f));

/** GET ops/accounts/ — one page with the total count. */
export const useAccounts = (f: AccountFilters, enabled = true) =>
  useQuery({
    queryKey: accountKeys.list(f),
    queryFn: () => apiPage<Account>("ops/accounts/", { ...accountQuery(f), page: f.page ?? 1, page_size: ACCOUNTS_PAGE_SIZE }),
    enabled,
    placeholderData: keepPreviousData,
  });

/** GET ops/accounts/by-username/:username/ — null when there is no such login. */
export const useAccount = (username: string) =>
  useSuspenseQuery({
    queryKey: accountKeys.byUsername(username),
    queryFn: async () => {
      try {
        return await api<Account>(`ops/accounts/by-username/${encodeURIComponent(username)}/`);
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) return null;
        throw err;
      }
    },
  }).data;

/** Profile search across organizations (backend searches name, e-mail, phone; needs 2+ characters). */
export const searchAccounts = (q: string) => api<AccountSearch>("support/accounts/", { query: { q } });

/** POST support/accounts/:id/link-profile/ — creates/restores membership with default roles, password untouched. */
export function useLinkProfile(userId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: Pick<Profile, "id" | "profileType">) =>
      api<Account>(`support/accounts/${userId}/link-profile/`, { method: "POST", body: { profileType: p.profileType, profileId: p.id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QK.accountSearch] });
      qc.invalidateQueries({ queryKey: [QK.accounts] });
    },
  });
}

export const statusLabel = (s: string) =>
  ({ active: "Активно", inactive: "Неактивно", archived: "Архив", suspended: "Приостановлено", invited: "Приглашён", revoked: "Отозвано" })[s] ?? s;

export const formatLastLogin = (iso: string | null | undefined) => formatDateLong(iso, "ни разу");

/** Display name: operator name, else the first profile's name, else the login. */
export const accountName = (a: Account) => a.operator?.fullName || a.profiles[0]?.fullName || "";
