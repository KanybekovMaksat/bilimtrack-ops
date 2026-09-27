import { create } from "zustand";
import { persist } from "zustand/middleware";
import { api, saveTokens } from "@/shared/api";

export type SessionUser = {
  id: number;
  username: string;
  email: string;
  /** Label under the name in the header. */
  role: string;
  initials: string;
  /** The global helpdesk account: cross-organization tickets and account search. */
  isSupport: boolean;
};

/** Slice of GET users/me/ the panel uses. */
type MeResponse = {
  user: { id: number; username: string; email: string; phone: string };
  memberships?: { organization?: { name?: string } | null; roles?: { name?: string }[] }[];
};

const SUPPORT_USERNAME = import.meta.env.VITE_SUPPORT_USERNAME || "bilimtrack_tech_support";

const initialsOf = (s: string) =>
  s
    .replace(/[^a-zA-Zа-яА-ЯёЁ\s._-]/g, "")
    .split(/[\s._-]+/)
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "?";

async function loadMe(): Promise<SessionUser> {
  const me = await api<MeResponse>("users/me/");
  const isSupport = me.user.username === SUPPORT_USERNAME;
  const firstRole = me.memberships?.[0]?.roles?.[0]?.name;
  return {
    id: me.user.id,
    username: me.user.username,
    email: me.user.email,
    role: isSupport ? "Поддержка Bilimtrack" : (firstRole ?? "Сотрудник"),
    initials: initialsOf(me.user.username),
    isSupport,
  };
}

type SessionState = {
  user: SessionUser | null;
  signIn: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  /** Local reset when the backend rejects the session (refresh failed). */
  expire: () => void;
};

export const useSession = create<SessionState>()(
  persist(
    (set) => ({
      user: null,
      signIn: async (username, password) => {
        const tokens = await api<{ access: string; refresh?: string }>("auth/login/", {
          method: "POST",
          body: { username, password },
          anonymous: true,
        });
        saveTokens(tokens);
        set({ user: await loadMe() });
      },
      signOut: async () => {
        try {
          await api("auth/logout/", { method: "POST", body: {} });
        } catch {
          // Signing out locally is enough if the server call fails.
        }
        saveTokens(null);
        set({ user: null });
      },
      expire: () => set({ user: null }),
    }),
    { name: "bilimtrack-ops.session", version: 2 },
  ),
);
