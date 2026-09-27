import { create } from "zustand";
import { persist } from "zustand/middleware";

/** Roles of Bilimtrack staff inside the ops panel. */
export type StaffRole = "admin" | "content";

export const staffRoleLabel: Record<StaffRole, string> = {
  admin: "Админ платформы",
  content: "Контент",
};

export type SessionUser = { name: string; login: string; initials: string };

type SessionState = {
  user: SessionUser | null;
  role: StaffRole;
  signIn: (login: string) => void;
  signOut: () => void;
  setRole: (role: StaffRole) => void;
};

export const useSession = create<SessionState>()(
  persist(
    (set) => ({
      user: null,
      role: "admin",
      // Mock sign-in: every staff login maps to the demo employee from the design.
      signIn: (login) => set({ user: { name: "Айдана С.", login: login || "a.satybaldy", initials: "АС" } }),
      signOut: () => set({ user: null, role: "admin" }),
      setRole: (role) => set({ role }),
    }),
    { name: "bilimtrack-ops.session" },
  ),
);
