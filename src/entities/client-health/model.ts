export type HealthTone = "red" | "yellow" | "green";

export const HEALTH_TONE: Record<HealthTone, { label: string; bg: string; fg: string; dot: string }> = {
  red: { label: "Красный", bg: "#fef2f2", fg: "#e7000b", dot: "#fb2c36" },
  yellow: { label: "Жёлтый", bg: "#fffbeb", fg: "#c2410c", dot: "#fd9a00" },
  green: { label: "Зелёный", bg: "#f0fdf4", fg: "#00a63e", dot: "#00c951" },
};

export type ClientHealth = {
  name: string;
  slug: string;
  short: string;
  type: string;
  tone: HealthTone;
  score: number;
  /** % of users active in the last 7 days */
  activity: number;
  lastLogin: string;
  tickets: number;
  critical: number;
  contractUntil: string;
  daysToRenewal: number;
  manager: string;
  risk: string;
};

export const CLIENT_HEALTH: ClientHealth[] = [
  { name: "Колледж связи", slug: "comtehno", short: "КС", type: "Колледж", tone: "red", score: 29, activity: 9, lastLogin: "23 дня назад", tickets: 3, critical: 1, contractUntil: "12 окт 2026", daysToRenewal: 15, manager: "Мадина А.", risk: "Нет входов администрации 23 дня · акт запуска не подписан" },
  { name: "Колледж «Сапат»", slug: "comtehno", short: "СП", type: "Колледж", tone: "red", score: 44, activity: 31, lastLogin: "вчера", tickets: 2, critical: 1, contractUntil: "31 окт 2026", daysToRenewal: 34, manager: "Бекзат Н.", risk: "Онбординг просрочен на 7 дней" },
  { name: "Школа №61", slug: "school61", short: "Ш6", type: "Школа", tone: "red", score: 41, activity: 22, lastLogin: "2 дня назад", tickets: 4, critical: 0, contractUntil: "15 ноя 2026", daysToRenewal: 49, manager: "Мадина А.", risk: "Использование упало на 48% за месяц" },
  { name: "Лицей «Бiлiм»", slug: "school61", short: "ЛБ", type: "Школа", tone: "red", score: 47, activity: 38, lastLogin: "5 дней назад", tickets: 1, critical: 0, contractUntil: "20 ноя 2026", daysToRenewal: 54, manager: "Ернар К.", risk: "Счёт за сентябрь не оплачен · нет контакта с директором" },
  { name: "Колледж «Алатау»", slug: "comtehno", short: "КА", type: "Колледж · пилот", tone: "yellow", score: 71, activity: 57, lastLogin: "12 мин назад", tickets: 2, critical: 0, contractUntil: "30 окт 2026", daysToRenewal: 33, manager: "Бекзат Н.", risk: "Пилот заканчивается, договор не согласован" },
  { name: "Comtehno", slug: "comtehno", short: "CT", type: "Колледж", tone: "yellow", score: 58, activity: 61, lastLogin: "4 мин назад", tickets: 9, critical: 0, contractUntil: "30 дек 2026", daysToRenewal: 94, manager: "Бекзат Н.", risk: "9 открытых тикетов · сбои выгрузки журнала в PDF" },
  { name: "МУИТ", slug: "muit", short: "МУ", type: "Университет", tone: "yellow", score: 66, activity: 74, lastLogin: "1 мин назад", tickets: 5, critical: 1, contractUntil: "31 мая 2027", daysToRenewal: 246, manager: "Бекзат Н.", risk: "Критический тикет по входу · рост ошибок авторизации" },
  { name: "НИШ Алматы", slug: "nis-almaty", short: "НИ", type: "Школа", tone: "green", score: 88, activity: 82, lastLogin: "только что", tickets: 1, critical: 0, contractUntil: "31 авг 2027", daysToRenewal: 338, manager: "Ернар К.", risk: "" },
  { name: "Гимназия №12", slug: "nis-almaty", short: "Г1", type: "Школа", tone: "green", score: 92, activity: 84, lastLogin: "3 мин назад", tickets: 0, critical: 0, contractUntil: "30 июн 2027", daysToRenewal: 276, manager: "Мадина А.", risk: "" },
];

export const HEALTH_SUMMARY: { tone: HealthTone; count: number; sub: string }[] = [
  { tone: "red", count: 4, sub: "могут не продлить" },
  { tone: "yellow", count: 6, sub: "нужен контакт менеджера" },
  { tone: "green", count: 24, sub: "стабильны" },
];

export const HEALTH_FACTORS = [
  { k: "Активность пользователей за 7 дней", w: "40%" },
  { k: "Открытые и критические тикеты", w: "20%" },
  { k: "Срок до продления и оплаты", w: "20%" },
  { k: "Использование модулей из договора", w: "20%" },
];

/** Colour for a 0–100 usage value: red below 35, amber below 65. */
export const usageColor = (v: number) => (v < 35 ? "#fb2c36" : v < 65 ? "#fd9a00" : "#00c951");
