import { create } from "zustand";
import { persist } from "zustand/middleware";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
};

type SessionState = {
  user: SessionUser | null;
  setUser: (user: SessionUser) => void;
  clear: () => void;
};

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      clear: () => set({ user: null }),
    }),
    { name: "bilimtrack-ops.session" },
  ),
);

export const useSessionUser = () => useSessionStore((s) => s.user);
