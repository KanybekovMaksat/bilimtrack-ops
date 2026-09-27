import { create } from "zustand";
import { useMockQuery } from "@/shared/api";

export type Account = {
  login: string;
  name: string;
  email: string;
  phone: string;
  status: "Активен";
  lastLogin: string;
  initials: string;
};

export type Profile = {
  name: string;
  type: string;
  org: string;
  orgShort: string;
  /** login of the linked account, or null for a profile with no way to sign in */
  account: string | null;
};

export type Membership = { org: string; orgShort: string; roles: string; status: "Активно" | "Архив"; main: boolean };

const ACCOUNT: Account = {
  login: "a.kaliyeva",
  name: "Калиева Айжан Ерлановна",
  email: "aizhan.k@muit.kz",
  phone: "+7 707 214 88 03",
  status: "Активен",
  lastLogin: "12 марта 2026",
  initials: "АК",
};

const PROFILES: Profile[] = [
  { name: "Калиева Айжан Ерлановна", type: "Учащийся · 2 курс, ВТ-23-1", org: "МУИТ", orgShort: "МУ", account: null },
  { name: "Калиева Айжан", type: "Учащийся · выпуск 2023", org: "Comtehno", orgShort: "CT", account: "a.kaliyeva" },
];

export const SEARCH_HINTS = ["+7 707 214 88 03", "a.kaliyeva", "aizhan@muit.kz", "Калиева Айжан"];

/** Mock search: every query finds the demo account and its two profiles. */
export const useAccountSearch = (query: string) =>
  useMockQuery(["account-search", query], () => ({ accounts: [ACCOUNT], profiles: PROFILES }));

type LinkState = { linked: boolean; link: () => void };

/** Whether the orphan МУИТ profile has been linked to a.kaliyeva in this session. */
export const useProfileLink = create<LinkState>()((set) => ({ linked: false, link: () => set({ linked: true }) }));

export function useAccount(login: string) {
  const linked = useProfileLink((s) => s.linked);
  const data = useMockQuery(["account", login], () => ACCOUNT);
  const comtehno: Membership = { org: "Comtehno", orgShort: "CT", roles: "Учащийся", status: "Архив", main: false };
  return {
    account: data,
    linked,
    memberships: linked
      ? [{ org: "МУИТ", orgShort: "МУ", roles: "Учащийся", status: "Активно" as const, main: true }, comtehno]
      : [comtehno],
    profiles: linked
      ? [{ org: "МУИТ", orgShort: "МУ", type: "Учащийся · ВТ-23-1" }, { org: "Comtehno", orgShort: "CT", type: "Учащийся · выпуск 2023" }]
      : [{ org: "Comtehno", orgShort: "CT", type: "Учащийся · выпуск 2023" }],
  };
}

export const ORPHAN_PROFILE = PROFILES[0];
