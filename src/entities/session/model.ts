import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ApiError, api, saveTokens } from "@/shared/api";
import { initialsOf } from "@/shared/lib";

/* Panel access = an active platform operator (backend: server/apps/ops, GET ops/me/).
   Organization owners, the old helpdesk login and everyone else get 403 there and are signed out. */

/** Ops privileges (backend `OpsPermission`): each opens a group of panel sections. */
export const OPS_PERMISSIONS = ["sales", "support", "organizations", "licenses", "accounts", "moderation", "tasks", "content", "audit", "team", "billing"] as const;
export type OpsPermission = (typeof OPS_PERMISSIONS)[number];

export type SessionUser = {
  id: number;
  username: string;
  email: string;
  fullName: string;
  /** Label under the name in the header. */
  role: string;
  initials: string;
  lastName: string;
  firstName: string;
  middleName: string;
  avatar: string | null;
  /** Ops sections this admin may use (backend `OpsPermission`). */
  permissions: string[];
  /** Temporary password issued by `create_ops_admins`: the panel asks to change it first. */
  mustChangePassword: boolean;
};

/** GET ops/me/ (OperatorSerializer). */
export type OperatorResponse = {
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

export function toSessionUser(me: OperatorResponse): SessionUser {
  return {
    id: me.id,
    username: me.username,
    email: me.email,
    fullName: me.fullName,
    role: me.roleLabel,
    initials: initialsOf(me.fullName || me.username),
    lastName: me.lastName ?? "",
    firstName: me.firstName ?? "",
    middleName: me.middleName ?? "",
    avatar: me.avatar ?? null,
    // Older backend without privileges: everything stays open.
    permissions: me.permissions ?? [...OPS_PERMISSIONS],
    mustChangePassword: me.mustChangePassword,
  };
}

export const NOT_OPERATOR = "not_operator";

async function loadOperator(): Promise<SessionUser> {
  try {
    const me = await api<OperatorResponse>("ops/me/");
    return toSessionUser(me);
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
  /** Replace the operator after a profile change (name, avatar). */
  setOperator: (me: OperatorResponse) => void;
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
      setOperator: (me) => set({ user: toSessionUser(me) }),
    }),
    // v3: the session comes from ops/me (older persisted shapes are dropped). A v3 session saved
    // before privileges existed has no `permissions` yet; `revalidate` fills it on load.
    // Only the operator is persisted; actions are recreated on load.
    { name: "bilimtrack-ops.session", version: 3, partialize: (s) => ({ user: s.user }), migrate: () => ({ user: null }) },
  ),
);

/** Does the signed-in admin hold this Ops privilege? */
export const useCan = () => {
  const permissions = useSession((s) => s.user?.permissions);
  return (code?: OpsPermission) => !code || !permissions || permissions.includes(code);
};
