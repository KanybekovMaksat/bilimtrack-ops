import { useMockQuery } from "@/shared/api";

/** Saved user segments and people across all organisations ("Списки и рассылки"). */
export const SEGMENTS = [
  { name: "Все преподаватели МУИТ", n: "286", desc: "организация = МУИТ, роль = преподаватель" },
  { name: "PRO-подписчики", n: "1 842", desc: "активная подписка PRO, любой период" },
  { name: "Родители НИШ Алматы", n: "410", desc: "организация = НИШ Алматы, тип профиля = родитель" },
  { name: "PRO истекает за 7 дней", n: "12", desc: "подписка заканчивается до 27 сентября" },
];

export type Person = {
  id: number;
  name: string;
  initials: string;
  login: string;
  org: string;
  orgShort: string;
  role: string;
  channels: string;
  subscription: string;
};

const PEOPLE: Person[] = [
  { id: 0, name: "Динара Жумабекова", initials: "ДЖ", login: "d.zhumabekova", org: "Comtehno", orgShort: "CT", role: "Преподаватель", channels: "Email · Telegram", subscription: "PRO" },
  { id: 1, name: "Алишер Темиров", initials: "АТ", login: "a.temirov", org: "МУИТ", orgShort: "МУ", role: "Учащийся", channels: "Push · WhatsApp", subscription: "PRO" },
  { id: 2, name: "Гульнара Оспанова", initials: "ГО", login: "g.ospanova", org: "НИШ Алматы", orgShort: "НИ", role: "Завуч", channels: "Email", subscription: "—" },
  { id: 3, name: "Ербол Сагындыков", initials: "ЕС", login: "e.sagyndykov", org: "Comtehno", orgShort: "CT", role: "Преподаватель", channels: "Telegram", subscription: "PRO" },
  { id: 4, name: "Асель Кожабек", initials: "АК", login: "a.kozhabek", org: "Школа №61", orgShort: "Ш6", role: "Родитель", channels: "WhatsApp", subscription: "Истекла" },
  { id: 5, name: "Мадина Аскарова", initials: "МА", login: "m.askarova", org: "МУИТ", orgShort: "МУ", role: "Учащийся", channels: "Push · Email", subscription: "Льготный" },
];

export const usePeople = () => useMockQuery(["people"], () => PEOPLE);
