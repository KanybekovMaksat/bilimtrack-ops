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

/** Home dashboard: work queue, events, 30-day series and client summary. */
const HOME = {
  queue: [
    { n: 7, label: "Новые заявки на демо", icon: "inbox", color: "#155dfc", to: "leads" },
    { n: 23, label: "Открытые тикеты", icon: "lifebuoy", color: "#0a0a0a", to: "tickets" },
    { n: 4, label: "Без ответа больше суток", icon: "clock-exclamation", color: "#fb2c36", to: "tickets" },
    { n: 3, label: "Новые идеи", icon: "bulb", color: "#fd9a00", to: "ideas" },
  ],
  events: [
    { icon: "brand-telegram", tint: "#eff6ff", color: "#155dfc", text: "Новый тикет из Telegram: «Не могу зайти после смены телефона»", org: "МУИТ · @aizhan_k", time: "5 мин назад", to: "ticket:TCK-TG7K2M04" },
    { icon: "inbox", tint: "#eff6ff", color: "#155dfc", text: "Заявка на демо с формы лендинга", org: "Колледж «Алатау» · Бакыт Ж.", time: "34 мин назад", to: "leads" },
    { icon: "lifebuoy", tint: "#fff7ed", color: "#fd9a00", text: "Тикет TCK-A3F92KD1 взят в работу", org: "Comtehno · Айдана С.", time: "1 ч назад", to: "ticket:TCK-A3F92KD1" },
    { icon: "building", tint: "#f0fdf4", color: "#00a63e", text: "Заведена организация «НИШ Алматы»", org: "Платформа · Ернар К.", time: "3 ч назад", to: "orgs" },
    { icon: "bulb", tint: "#fff7ed", color: "#fd9a00", text: "Новая идея: «Показывать GPA прямо в шапке профиля»", org: "МУИТ · Алишер Т.", time: "вчера, 17:20", to: "ideas" },
    { icon: "article", tint: "#faf5ff", color: "#ad46ff", text: "Статья «Как колледжу перейти на электронный журнал» опубликована", org: "Контент · Жанна М.", time: "вчера, 12:05", to: "posts" },
  ],
  leadsSeries: [4, 3, 6, 5, 8, 6, 4, 2, 7, 9, 6, 8, 5, 4, 9, 11, 7, 6, 8, 12, 9, 7, 10, 8, 6, 11, 13, 9, 10, 14],
  ticketSeries: [12, 14, 11, 17, 15, 19, 13, 8, 16, 18, 21, 17, 14, 12, 20, 23, 19, 16, 18, 22, 20, 15, 19, 24, 21, 17, 23, 20, 22, 26],
  summary: [
    { n: "34", label: "Организаций всего", color: "#0a0a0a" },
    { n: "29", label: "Активных", color: "#00a63e" },
    { n: "5", label: "На паузе", color: "#fd9a00" },
    { n: "41 280", label: "Учащихся на платформе", color: "#0a0a0a" },
  ],
  drafts: [
    { title: "Электронный журнал для колледжа: с чего начать", date: "черновик · 19 сен" },
    { title: "Как мы считаем GPA в Bilimtrack", date: "черновик · 16 сен" },
    { title: "Интервью: цифровизация НИШ Алматы", date: "запланировано · 24 сен" },
  ],
};

export const useHomeDashboard = () => useMockQuery(["home"], () => HOME);
