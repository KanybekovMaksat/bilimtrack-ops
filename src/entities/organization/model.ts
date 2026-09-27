export type OrgType = "Университет" | "Колледж" | "Школа" | "Другое";
export type OrgStatus = "Активна" | "На паузе";

export type Organization = {
  slug: string;
  name: string;
  short: string;
  type: OrgType;
  status: OrgStatus;
  students: string;
  staff: string;
  branches: string;
  since: string;
  lastActivity: string;
  /** No activity for 14+ days. */
  stale: boolean;
};

export const ORGANIZATIONS: Organization[] = [
  { slug: "muit", name: "МУИТ", short: "МУ", type: "Университет", status: "Активна", students: "4 120", staff: "286", branches: "3", since: "12 мар 2024", lastActivity: "11 минут назад", stale: false },
  { slug: "comtehno", name: "Comtehno", short: "CT", type: "Колледж", status: "Активна", students: "1 840", staff: "132", branches: "2", since: "04 сен 2024", lastActivity: "сегодня, 08:41", stale: false },
  { slug: "nis-almaty", name: "НИШ Алматы", short: "НИ", type: "Школа", status: "Активна", students: "980", staff: "94", branches: "1", since: "20 сен 2026", lastActivity: "3 часа назад", stale: false },
  { slug: "school61", name: "Школа №61", short: "Ш6", type: "Школа", status: "Активна", students: "1 210", staff: "78", branches: "1", since: "18 янв 2025", lastActivity: "22 дня назад", stale: true },
  { slug: "zerde", name: "Учебный центр «Зерде»", short: "УЗ", type: "Другое", status: "На паузе", students: "140", staff: "12", branches: "1", since: "02 июн 2025", lastActivity: "41 день назад", stale: true },
  { slug: "it-astana", name: "IT-лицей Astana", short: "IT", type: "Школа", status: "Активна", students: "560", staff: "44", branches: "1", since: "11 фев 2026", lastActivity: "вчера, 19:02", stale: false },
];

export const ORG_TOTAL = 34;

export type OrgModule = { key: string; name: string; description: string; on: boolean; features: { name: string; on: boolean }[] };
export type FlagGroup = { title: string; flags: { name: string; on: boolean }[] };

/** Everything the org card needs beyond the list row. */
export type OrgDetail = {
  slug: string;
  legalName: string;
  owner: { name: string; initials: string; login: string };
  fields: { k: string; v: string }[];
  health: { score: number; tone: "red" | "yellow" | "green"; note: string };
  healthFacts: { k: string; v: string; sub: string; accent?: "danger" | "brand" }[];
  modules: OrgModule[];
  flagGroups: FlagGroup[];
  tree: { level: number; name: string; kind: string; icon: string }[];
  people: { name: string; initials: string; login: string; roles: string; last: string }[];
  activity: number[];
};

const MUIT: Omit<OrgDetail, "slug"> = {
  legalName: "НАО «Международный университет информационных технологий»",
  owner: { name: "Ернар Калиев", initials: "ЕК", login: "e.kaliyev" },
  fields: [
    { k: "Юридическое название", v: "НАО «Международный университет информационных технологий»" },
    { k: "Тип", v: "Университет" },
    { k: "Слаг", v: "muit" },
    { k: "Владелец", v: "Ернар Калиев" },
    { k: "Контакт", v: "+7 727 320 40 50 · info@muit.kz" },
    { k: "Часовой пояс", v: "Asia/Almaty (UTC+5)" },
    { k: "Язык интерфейса", v: "Русский" },
    { k: "Страна", v: "Казахстан" },
    { k: "Подключена", v: "12 марта 2024" },
  ],
  health: { score: 66, tone: "yellow", note: "Риск непродления средний · месяц назад было 78" },
  healthFacts: [
    { k: "Активность", v: "74% за 7 дней", sub: "▼ 6 п.п. за месяц" },
    { k: "Открытые тикеты", v: "5 · 1 критический", sub: "медиана ответа 41 мин", accent: "danger" },
    { k: "Договор", v: "до 31 мая 2027", sub: "Расширенный · 1,2 млн KGS/год" },
    { k: "Продление", v: "через 246 дней", sub: "переговоры с марта" },
    { k: "Ответственный менеджер", v: "Бекзат Н.", sub: "последний контакт 12 сен", accent: "brand" },
  ],
  modules: [
    { key: "edu", name: "Учебный процесс", on: true, description: "расписание, журнал, домашние задания", features: [{ name: "Расписание занятий", on: true }, { name: "Замены преподавателей", on: true }, { name: "Электронный журнал", on: true }, { name: "Домашние задания", on: false }] },
    { key: "grade", name: "Оценивание", on: true, description: "оценки, ведомости, GPA", features: [{ name: "Пятибалльные оценки", on: true }, { name: "Ведомости и табели", on: true }, { name: "GPA и транскрипт", on: true }] },
    { key: "admission", name: "Приём и документы", on: false, description: "онлайн-заявки абитуриентов", features: [{ name: "Онлайн-заявки", on: false }, { name: "Проверка документов", on: false }, { name: "Договоры", on: false }] },
    { key: "finance", name: "Финансы", on: true, description: "счета учащимся, должники", features: [{ name: "Счета учащимся", on: true }, { name: "Должники", on: true }, { name: "Рассрочка", on: false }] },
    { key: "public", name: "Публичность", on: true, description: "что видно учащимся и родителям", features: [{ name: "Лента новостей", on: true }, { name: "Рейтинг учащихся", on: false }, { name: "Публичные профили", on: true }] },
  ],
  flagGroups: [
    { title: "Учебный процесс", flags: [{ name: "Семестры вместо четвертей", on: true }, { name: "Кредитная система", on: true }, { name: "Элективные курсы", on: true }, { name: "Учебная практика", on: true }, { name: "Сменность занятий", on: false }] },
    { title: "Оценивание", flags: [{ name: "GPA", on: true }, { name: "Транскрипт", on: true }, { name: "Табели по четвертям", on: false }, { name: "Автоматический перевод в буквы", on: true }] },
    { title: "Люди", flags: [{ name: "Факультеты и кафедры", on: true }, { name: "Классное руководство", on: false }, { name: "Кураторы групп", on: true }, { name: "Родительские аккаунты", on: false }] },
    { title: "Публичность", flags: [{ name: "Лента новостей", on: true }, { name: "Рейтинг учащихся", on: false }, { name: "Публичные профили", on: true }, { name: "Комментарии", on: false }] },
  ],
  tree: [
    { level: 0, name: "МУИТ", kind: "Организация", icon: "building" },
    { level: 1, name: "Главный кампус (Алматы)", kind: "Филиал", icon: "building-community" },
    { level: 2, name: "Факультет компьютерных технологий", kind: "Подразделение", icon: "school" },
    { level: 2, name: "Факультет кибербезопасности", kind: "Подразделение", icon: "school" },
    { level: 1, name: "Кампус «Байтурсынова»", kind: "Филиал", icon: "building-community" },
    { level: 2, name: "Колледж при МУИТ", kind: "Подразделение", icon: "school" },
    { level: 1, name: "Онлайн-отделение", kind: "Филиал", icon: "building-community" },
  ],
  people: [
    { name: "Ернар Калиев", initials: "ЕК", login: "e.kaliyev", roles: "Владелец · Админ организации", last: "сегодня, 09:12" },
    { name: "Динара Жумабекова", initials: "ДЖ", login: "d.zhumabekova", roles: "Преподаватель", last: "сегодня, 08:44" },
    { name: "Алия Сериккызы", initials: "АС", login: "a.serikkyzy", roles: "Завуч · Расписание", last: "вчера, 18:20" },
    { name: "Мурат Ахметов", initials: "МА", login: "m.akhmetov", roles: "Бухгалтерия", last: "18 сен" },
  ],
  activity: Array.from({ length: 30 }, (_, i) => 60 + Math.round(38 * Math.sin(i / 2.1)) + (i % 5) * 6),
};

/** The prototype only details МУИТ; other orgs reuse its tabs with their own header data. */
export function orgDetail(slug: string): OrgDetail {
  const org = ORGANIZATIONS.find((o) => o.slug === slug);
  if (slug === "muit" || !org) return { slug: "muit", ...MUIT };
  return {
    ...MUIT,
    slug,
    legalName: org.name,
    fields: MUIT.fields.map((f) =>
      f.k === "Юридическое название" ? { ...f, v: org.name } : f.k === "Тип" ? { ...f, v: org.type } : f.k === "Слаг" ? { ...f, v: slug } : f.k === "Подключена" ? { ...f, v: org.since } : f,
    ),
    tree: [{ level: 0, name: org.name, kind: "Организация", icon: "building" }, ...MUIT.tree.slice(1, 3)],
  };
}

export const PRESETS = ["Школа", "Колледж", "Университет", "Свой набор"];
