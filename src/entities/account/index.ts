import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { api } from "@/shared/api";

/* Platform-wide account search for the helpdesk account.
   Backend: server/apps/users (support_accounts use cases), /api/v1/support/accounts/. */

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

export type Account = {
  id: number;
  username: string;
  email: string;
  phone: string;
  isActive: boolean;
  lastLogin: string | null;
  memberships: Membership[];
  profiles: Profile[];
};

export type AccountSearch = { accounts: Account[]; profiles: Profile[] };

export const accountKeys = { search: (q: string) => ["account-search", q] as const };

/** Backend searches username, email, phone and profile names; needs at least 2 characters. */
export const searchAccounts = (q: string) => api<AccountSearch>("support/accounts/", { query: { q } });

export const useAccountSearch = (q: string) =>
  useSuspenseQuery({ queryKey: accountKeys.search(q), queryFn: () => searchAccounts(q) }).data;

/** There is no GET-by-id endpoint, so an account card is resolved through search by username. */
export function useAccount(username: string) {
  const { accounts } = useAccountSearch(username);
  return accounts.find((a) => a.username === username) ?? null;
}

/** POST support/accounts/:id/link-profile/ — creates/restores membership with default roles, password untouched. */
export function useLinkProfile(userId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: Pick<Profile, "id" | "profileType">) =>
      api<Account>(`support/accounts/${userId}/link-profile/`, { method: "POST", body: { profileType: p.profileType, profileId: p.id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["account-search"] }),
  });
}

export const statusLabel = (s: string) => ({ active: "Активно", inactive: "Неактивно", archived: "Архив", suspended: "Приостановлено" })[s] ?? s;

const dt = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric" });
export const formatLastLogin = (iso: string | null) => (iso ? dt.format(new Date(iso)) : "ни разу");
