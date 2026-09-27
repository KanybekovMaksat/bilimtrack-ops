import { create } from "zustand";
import { persist } from "zustand/middleware";

export type SessionUser = { name: string; login: string; initials: string; role: string };

type SessionState = {
  user: SessionUser | null;
  signIn: (login: string) => void;
  signOut: () => void;
};

export const useSession = create<SessionState>()(
  persist(
    (set) => ({
      user: null,
      // Mock sign-in: every staff login maps to the demo employee from the design.
      signIn: (login) =>
        set({ user: { name: "Айдана С.", login: login || "a.satybaldy", initials: "АС", role: "Админ платформы" } }),
      signOut: () => set({ user: null }),
    }),
    { name: "bilimtrack-ops.session", version: 1 },
  ),
);
