import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ApiError, api, saveTokens } from "@/shared/api";
import { initialsOf } from "@/shared/lib";

/* Panel access = an active platform operator (backend: server/apps/ops, GET ops/me/).
   Organization owners, the old helpdesk login and everyone else get 403 there and are signed out. */

export type SessionUser = {
  id: number;
  username: string;
  email: string;
  fullName: string;
  /** Label under the name in the header. */
  role: string;
  initials: string;
  /** Temporary password issued by `create_ops_admins`: the panel asks to change it first. */
  mustChangePassword: boolean;
};

/** GET ops/me/. */
type OperatorResponse = {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: string;
  roleLabel: string;
  lastLogin: string | null;
  mustChangePassword: boolean;
};

export const NOT_OPERATOR = "not_operator";

async function loadOperator(): Promise<SessionUser> {
  try {
    const me = await api<OperatorResponse>("ops/me/");
    return {
      id: me.id,
      username: me.username,
      email: me.email,
      fullName: me.fullName,
      role: me.roleLabel,
      initials: initialsOf(me.fullName || me.username),
      mustChangePassword: me.mustChangePassword,
    };
  } catch (err) {
    if (err instanceof ApiError && err.status === 403) {
      throw new ApiError(403, "Bilimtrack Ops доступен только команде Bilimtrack. У этой учётной записи нет доступа.", NOT_OPERATOR);
    }
    throw err;
  }
}

async function serverLogout() {
  try {
    await api("auth/logout/", { method: "POST", body: {} });
  } catch {
    // Signing out locally is enough if the server call fails.
  }
  saveTokens(null);
}

type SessionState = {
  user: SessionUser | null;
  signIn: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  /** Re-reads ops/me: drops the session if access was revoked since the last visit. */
  revalidate: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  /** Local reset when the backend rejects the session (refresh failed). */
  expire: () => void;
};

export const useSession = create<SessionState>()(
  persist(
    (set, get) => ({
      user: null,
      signIn: async (username, password) => {
        const tokens = await api<{ access: string; refresh?: string }>("auth/login/", {
          method: "POST",
          body: { username, password },
          anonymous: true,
        });
        saveTokens(tokens);
        try {
          set({ user: await loadOperator() });
        } catch (err) {
          // Valid login, but not a Bilimtrack operator: do not keep the session.
          await serverLogout();
          throw err;
        }
      },
      signOut: async () => {
        await serverLogout();
        set({ user: null });
      },
      revalidate: async () => {
        if (!get().user) return;
        try {
          set({ user: await loadOperator() });
        } catch (err) {
          if (err instanceof ApiError && err.code === NOT_OPERATOR) {
            await serverLogout();
            set({ user: null });
          }
        }
      },
      changePassword: async (currentPassword, newPassword) => {
        await api("auth/change-password/", {
          method: "POST",
          body: { currentPassword, newPassword, confirmPassword: newPassword },
        });
        const user = get().user;
        if (user) set({ user: { ...user, mustChangePassword: false } });
      },
      expire: () => set({ user: null }),
    }),
    // v3: the session now comes from ops/me (older persisted shapes are dropped).
    { name: "bilimtrack-ops.session", version: 3, migrate: () => ({ user: null }) as never },
  ),
);
