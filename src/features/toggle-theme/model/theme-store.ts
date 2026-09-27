import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Theme = "light" | "dark";

type ThemeState = { theme: Theme; toggle: () => void };

const systemTheme = (): Theme =>
  window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: systemTheme(),
      toggle: () => set({ theme: get().theme === "dark" ? "light" : "dark" }),
    }),
    { name: "bilimtrack-ops.theme" },
  ),
);
