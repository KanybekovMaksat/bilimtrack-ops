import { create } from "zustand";

export type ImpersonationMode = "view" | "full";

type Session = { login: string; mode: ImpersonationMode; basis: string };

type ImpersonationState = {
  session: Session | null;
  log: { t: string; text: string }[];
  /** Set when a session was ended; the account page shows a notice once. */
  ended: boolean;
  start: (login: string, mode: ImpersonationMode, reason: string) => void;
  end: () => void;
  dismissEnded: () => void;
};

export const IMPERSONATION_BASIS = { id: "TCK-TG7K2M04", subject: "Не могу зайти в приложение после смены телефона" };

export const useImpersonation = create<ImpersonationState>()((set) => ({
  session: null,
  log: [],
  ended: false,
  start: (login, mode, reason) =>
    set({
      ended: false,
      session: { login, mode, basis: IMPERSONATION_BASIS.id },
      // Mock audit trail of what the support agent opened.
      log: [
        { t: "14:21", text: `Сеанс начат · Айдана С. · ${mode === "full" ? "полный доступ" : "только просмотр"} · 30 минут` },
        { t: "14:21", text: `Причина: «${reason.trim()}» · основание ${IMPERSONATION_BASIS.id}` },
        { t: "14:22", text: "Открыт раздел «Главная»" },
        { t: "14:23", text: "Открыт раздел «Профиль → Настройки входа»" },
        { t: "14:24", text: "Просмотрено: привязанный телефон не совпадает с номером из тикета" },
      ],
    }),
  end: () => set({ session: null, ended: true }),
  dismissEnded: () => set({ ended: false }),
}));

export const modeLabel = (mode: ImpersonationMode) => (mode === "full" ? "полный доступ" : "только просмотр");
