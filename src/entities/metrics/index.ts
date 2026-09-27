import { useMockQuery } from "@/shared/api";

/** Business metrics as of September 2026 (mock). */
const METRICS = {
  kpi: [
    { label: "Годовая выручка по договорам", value: "12,6 млн", delta: "▲ 8% за квартал", good: true, sub: "KGS · 31 действующий договор" },
    { label: "Процент продлений", value: "87%", delta: "▼ 3 п.п.", good: false, sub: "20 из 23 договоров за 12 месяцев" },
    { label: "Использование", value: "71%", delta: "▲ 2 п.п.", good: true, sub: "пользователей заходили за 7 дней" },
    { label: "Пилот → договор", value: "42%", delta: "▲ 9 п.п.", good: true, sub: "5 из 12 пилотов за год" },
  ],
  /** annual contract revenue by month, million KGS */
  revenue: [9.8, 10.1, 10.1, 10.4, 10.9, 11.0, 11.2, 11.6, 11.6, 12.0, 12.3, 12.6],
  months: ["окт", "ноя", "дек", "янв", "фев", "мар", "апр", "май", "июн", "июл", "авг", "сен"],
  funnel: [
    { label: "Заявки на демо", n: 148 },
    { label: "Демо проведено", n: 61 },
    { label: "Пилот", n: 12 },
    { label: "Договор", n: 5 },
  ],
  usage: [
    { org: "Гимназия №12", value: 84, delta: "▲ 3" },
    { org: "НИШ Алматы", value: 82, delta: "▲ 1" },
    { org: "МУИТ", value: 74, delta: "▼ 6" },
    { org: "Comtehno", value: 61, delta: "▼ 9" },
    { org: "Колледж «Алатау»", value: 57, delta: "▲ 12" },
    { org: "Лицей «Бiлiм»", value: 38, delta: "▼ 7" },
    { org: "Школа №61", value: 22, delta: "▼ 21" },
    { org: "Колледж связи", value: 9, delta: "▼ 14" },
  ],
  renewals: [
    { org: "Колледж связи", tone: "red", date: "12 окт", sum: "180 000 KGS" },
    { org: "Колледж «Алатау»", tone: "yellow", date: "30 окт", sum: "пилот → 360 000" },
    { org: "Колледж «Сапат»", tone: "red", date: "31 окт", sum: "240 000 KGS" },
    { org: "Школа №61", tone: "red", date: "15 ноя", sum: "150 000 KGS" },
    { org: "Лицей «Бiлiм»", tone: "red", date: "20 ноя", sum: "120 000 KGS" },
    { org: "Comtehno", tone: "yellow", date: "30 дек", sum: "1 380 000 KGS" },
  ] as { org: string; tone: "red" | "yellow" | "green"; date: string; sum: string }[],
};

export const useMetrics = () => useMockQuery(["metrics"], () => METRICS);
