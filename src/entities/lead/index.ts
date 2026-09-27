import { useMockQuery } from "@/shared/api";
import type { PillTone } from "@/shared/ui";

export type LeadStatus = "Новая" | "На связи" | "Демо назначено" | "Закрыта";

export const LEAD_STATUSES: LeadStatus[] = ["Новая", "На связи", "Демо назначено", "Закрыта"];

export const leadStatusTone: Record<LeadStatus, PillTone> = {
  Новая: "solidBrand",
  "На связи": "info",
  "Демо назначено": "orange",
  Закрыта: "neutral",
};

export type Lead = {
  date: string;
  name: string;
  contact: string;
  org: string;
  type: string;
  size: string;
  source: string;
  /** Source is an article: the name links to it. */
  fromArticle: boolean;
  status: LeadStatus;
  city?: string;
};

const LEADS: Lead[] = [
  { date: "20 сен, 15:12", name: "Бакыт Жунусов", contact: "+996 555 21 40 88", org: "Колледж «Алатау»", city: "Бишкек", type: "Колледж", size: "420", source: "Лендинг", fromArticle: false, status: "Новая" },
  { date: "20 сен, 11:40", name: "Салтанат Ибраева", contact: "s.ibraeva@nu.edu.kz", org: "Nazarbayev University", type: "Университет", size: "6 800", source: "Статья «GPA в колледже»", fromArticle: true, status: "Новая" },
  { date: "19 сен, 18:03", name: "Руслан Абдиев", contact: "+7 701 334 12 09", org: "Школа-гимназия №14", type: "Школа", size: "980", source: "Лендинг", fromArticle: false, status: "На связи" },
  { date: "19 сен, 09:22", name: "Айгерим Нурлан", contact: "aigerim@comtehno.kg", org: "Comtehno (филиал Ош)", type: "Колледж", size: "310", source: "Статья «Электронный журнал»", fromArticle: true, status: "Демо назначено" },
  { date: "18 сен, 16:45", name: "Тимур Оспанов", contact: "+7 705 887 33 21", org: "IT-лицей Astana", type: "Школа", size: "540", source: "Лендинг", fromArticle: false, status: "На связи" },
  { date: "17 сен, 10:11", name: "Жанара Касымова", contact: "zh.kasymova@mail.ru", org: "Учебный центр «Зерде»", type: "Другое", size: "120", source: "Instagram Direct", fromArticle: false, status: "Закрыта" },
  { date: "16 сен, 14:30", name: "Марат Сейтов", contact: "+996 700 44 12 90", org: "МУИТ (второй кампус)", type: "Университет", size: "2 400", source: "Лендинг", fromArticle: false, status: "Демо назначено" },
];

export const useLeads = () => useMockQuery(["leads"], () => LEADS);

export const LEAD_NOTE = "Просили посмотреть, как считается GPA. Созвон в понедельник, 22 сен, 11:00.";
