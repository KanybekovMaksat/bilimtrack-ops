import { create } from "zustand";

export type AnnouncementType = "release" | "maint" | "important";

export const ANNOUNCEMENT_TYPE: Record<
  AnnouncementType,
  { label: string; icon: string; color: string; bg: string; title: string; text: string }
> = {
  release: {
    label: "Релиз",
    icon: "rocket",
    color: "#155dfc",
    bg: "#eff6ff",
    title: "Обновление 2.14: выгрузка журнала в PDF",
    text: "Выгрузка оценок за модуль теперь работает для групп любого размера и занимает до 10 секунд. Обновление уже доступно, ничего настраивать не нужно.",
  },
  maint: {
    label: "Плановые работы",
    icon: "tool",
    color: "#c2410c",
    bg: "#fffbeb",
    title: "Плановые работы 28 сентября, 02:00–04:00",
    text: "В это время портал и мобильное приложение будут недоступны. Данные не пострадают, журналы и расписание сохранятся.",
  },
  important: {
    label: "Важное",
    icon: "alert-circle",
    color: "#e7000b",
    bg: "#fef2f2",
    title: "Старые версии приложения перестанут работать 1 октября",
    text: "Попросите учащихся и преподавателей обновить мобильное приложение Bilimtrack из App Store или Google Play.",
  },
};

/** Organisation counts by kind and average recipients per org by role — for the reach estimate. */
export const ORGS_BY_KIND: Record<string, number> = { Школы: 14, Колледжи: 13, Университеты: 7 };
export const PEOPLE_PER_ORG: Record<string, number> = { Администрация: 6, Преподаватели: 38, Учащиеся: 1210, Родители: 900 };
export const ANNOUNCE_ORGS = ["МУИТ", "Comtehno", "НИШ Алматы", "Школа №61", "Колледж «Алатау»", "Колледж связи", "Гимназия №12", "Лицей «Бiлiм»"];
export const ANNOUNCE_CHANNELS = ["Баннер в панели", "Email", "Push в приложении", "Telegram"];

export type SentAnnouncement = { type: AnnouncementType; date: string; title: string; audience: string; reach: string };

type AnnouncementState = {
  history: SentAnnouncement[];
  record: (a: SentAnnouncement) => void;
};

export const useAnnouncements = create<AnnouncementState>()((set) => ({
  history: [
    { type: "release", date: "19 сен", title: "Обновление 2.13: новый экран расписания", audience: "Все учреждения · 34", reach: "прочитали 71%" },
    { type: "maint", date: "14 сен", title: "Плановые работы 15 сентября, 03:00–04:00", audience: "Все учреждения · 34", reach: "прочитали 64%" },
    { type: "release", date: "2 сен", title: "Модуль «Приём» для колледжей", audience: "Колледжи · 13", reach: "прочитали 58%" },
  ],
  record: (a) => set((s) => ({ history: [a, ...s.history] })),
}));
