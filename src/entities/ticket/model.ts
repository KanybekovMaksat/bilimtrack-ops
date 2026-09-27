export type TicketPriority = "crit" | "high" | "mid" | "norm" | "low";
export type TicketStatus = "open" | "work" | "done" | "closed";
export type TicketSource = "tg" | "web" | "adm" | "api";
export type SlaState = "over" | "soon" | "ok" | "done";

export type Ticket = {
  id: string;
  subject: string;
  author: string;
  org: string;
  orgShort: string;
  category: string;
  priority: TicketPriority;
  source: TicketSource;
  status: TicketStatus;
  updated: string;
  unread?: boolean;
  sla: { label: string; state: SlaState };
};

export type MessageKind = "user" | "support" | "bot" | "system";
export type TicketMessage = { kind: MessageKind; who: string; time: string; text: string };

export type TicketDetail = {
  created: string;
  /** Author matched to an account, or null when the ticket came from an unknown Telegram user. */
  author: { initials: string; name: string; role: string } | null;
  unknownAuthorNote?: string;
  url: string;
  techContext: string;
  messages: TicketMessage[];
  fields: { k: string; v: string; editable?: boolean }[];
  history: { text: string; who: string; time: string }[];
};

/** Priority scale, variant A from the design review: only the top of the scale shouts. */
export const PRIORITY: Record<TicketPriority, { label: string; bg: string; fg: string; weight: number; dot: boolean }> = {
  crit: { label: "Критический", bg: "#fb2c36", fg: "#ffffff", weight: 600, dot: false },
  high: { label: "Высокий", bg: "#fff7ed", fg: "#c2410c", weight: 600, dot: true },
  mid: { label: "Средний", bg: "#ffffff", fg: "#525252", weight: 500, dot: true },
  norm: { label: "Обычный", bg: "transparent", fg: "#737373", weight: 400, dot: false },
  low: { label: "Низкий", bg: "transparent", fg: "#a1a1a1", weight: 400, dot: false },
};

export const STATUS: Record<TicketStatus, { label: string; color: string }> = {
  open: { label: "Открыто", color: "#155dfc" },
  work: { label: "В работе", color: "#fd9a00" },
  done: { label: "Решено", color: "#00c951" },
  closed: { label: "Закрыто", color: "#a1a1a1" },
};

export const SOURCE: Record<TicketSource, { label: string; icon: string; color: string }> = {
  tg: { label: "Telegram", icon: "brand-telegram", color: "#2b7fff" },
  web: { label: "Веб-портал", icon: "world", color: "#a1a1a1" },
  adm: { label: "Панель", icon: "layout-dashboard", color: "#a1a1a1" },
  api: { label: "API", icon: "code", color: "#a1a1a1" },
};

export const SLA_STYLE: Record<SlaState, { bg: string; fg: string; weight: number }> = {
  over: { bg: "#fb2c36", fg: "#ffffff", weight: 600 },
  soon: { bg: "#fffbeb", fg: "#c2410c", weight: 500 },
  ok: { bg: "transparent", fg: "#737373", weight: 400 },
  done: { bg: "transparent", fg: "#a1a1a1", weight: 400 },
};

export const SLA_POLICY = "SLA первого ответа: критический 1 ч · высокий 4 ч · средний 8 ч · обычный и низкий 24 ч";

export const ticketTabs = [
  { key: "mine", label: "Мои", count: 6 },
  { key: "open", label: "Открытые", count: 23 },
  { key: "work", label: "В работе", count: 9 },
  { key: "done", label: "Решённые", count: 112 },
  { key: "all", label: "Все", count: 288 },
] as const;

export const TICKETS: Ticket[] = [
  { id: "TCK-TG7K2M04", subject: "Не могу зайти в приложение после смены телефона", author: "@aizhan_k", org: "МУИТ", orgShort: "МУ", category: "Техническая проблема", priority: "crit", source: "tg", status: "open", updated: "5 мин назад", unread: true, sla: { label: "осталось 12 мин", state: "soon" } },
  { id: "TCK-A3F92KD1", subject: "Оценки за модуль не выгружаются в PDF", author: "Динара Ж.", org: "Comtehno", orgShort: "CT", category: "Техническая проблема", priority: "high", source: "adm", status: "work", updated: "22 мин назад", unread: true, sla: { label: "в норме · 5 ч", state: "ok" } },
  { id: "TCK-B81LQ2X7", subject: "Списались деньги, PRO не подключился", author: "Алишер Т.", org: "МУИТ", orgShort: "МУ", category: "Оплата", priority: "high", source: "web", status: "open", updated: "1 ч назад", unread: true, sla: { label: "просрочен 18 мин", state: "over" } },
  { id: "TCK-C40ZR9P2", subject: "Как выставить замену преподавателя", author: "Гульнара О.", org: "НИШ Алматы", orgShort: "НИ", category: "Обучение работе", priority: "mid", source: "adm", status: "work", updated: "3 ч назад", sla: { label: "в норме · 1 д", state: "ok" } },
  { id: "TCK-D22MW1J5", subject: "Ошибка 500 при открытии журнала 2 курса", author: "Ербол С.", org: "Comtehno", orgShort: "CT", category: "Техническая проблема", priority: "mid", source: "api", status: "open", updated: "5 ч назад", sla: { label: "осталось 55 мин", state: "soon" } },
  { id: "TCK-E97YH3N8", subject: "Документы на поступление не прикрепляются", author: "Асель К.", org: "Школа №61", orgShort: "Ш6", category: "Поступление и документы", priority: "norm", source: "web", status: "open", updated: "вчера, 18:40", sla: { label: "просрочен 2 ч", state: "over" } },
  { id: "TCK-F15KD8R3", subject: "Предложение по сотрудничеству с колледжем", author: "Нурлан Б.", org: "Comtehno", orgShort: "CT", category: "Сотрудничество", priority: "low", source: "web", status: "work", updated: "вчера, 11:02", sla: { label: "в норме · 2 д", state: "ok" } },
  { id: "TCK-G63TP5V9", subject: "Спасибо за новый экран расписания", author: "Мадина А.", org: "МУИТ", orgShort: "МУ", category: "Отзыв", priority: "low", source: "tg", status: "done", updated: "18 сен", sla: { label: "выполнен", state: "done" } },
];

const DETAILS: Record<string, TicketDetail> = {
  "TCK-TG7K2M04": {
    created: "20 сен, 14:02",
    author: null,
    unknownAuthorNote: "@aizhan_k",
    url: "—",
    techContext:
      '{\n  "source": "telegram_bot",\n  "chat_id": 774102938,\n  "username": "aizhan_k",\n  "phone_in_text": "+7 707 214 88 03",\n  "account_matched": false\n}',
    messages: [
      { kind: "system", who: "Система", time: "14:02", text: "Тикет создан из Telegram-бота" },
      { kind: "user", who: "@aizhan_k", time: "14:02", text: "Здравствуйте! Поменяла телефон, теперь не могу зайти в приложение. Пишет «пользователь не найден». Я студентка МУИТ, 2 курс. Телефон +7 707 214 88 03" },
      { kind: "bot", who: "Бот Lucky", time: "14:02", text: "Автор не сопоставлен с аккаунтом: совпадений по chat_id и номеру не найдено." },
      { kind: "user", who: "@aizhan_k", time: "14:09", text: "Логин вроде a.kaliyeva, но точно не помню" },
    ],
    fields: [
      { k: "Организация", v: "МУИТ (по тексту, не подтверждена)" },
      { k: "Статус", v: "Открыто", editable: true },
      { k: "Приоритет", v: "Критический", editable: true },
      { k: "Категория", v: "Техническая проблема", editable: true },
      { k: "Источник", v: "Telegram-бот" },
      { k: "Контакт", v: "+7 707 214 88 03" },
    ],
    history: [
      { text: "Тикет создан из Telegram-бота", who: "Система", time: "20 сен, 14:02" },
      { text: "Приоритет повышен: Обычный → Критический", who: "Айдана С.", time: "20 сен, 14:05" },
    ],
  },
  "TCK-A3F92KD1": {
    created: "20 сен, 09:14",
    author: { initials: "ДЖ", name: "Динара Жумабекова", role: "Преподаватель · Comtehno" },
    url: "https://comtehno.bilimtrack.kg/journal/2025/module-1/export",
    techContext:
      '{\n  "error": "ExportTimeout",\n  "module_id": 4812,\n  "students": 212,\n  "duration_ms": 30000,\n  "browser": "Chrome 129 / Windows 11"\n}',
    messages: [
      { kind: "user", who: "Динара Жумабекова", time: "09:14", text: "Пытаюсь выгрузить оценки за 1 модуль в PDF — крутится и потом ошибка. Нужно сдать до пятницы." },
      { kind: "bot", who: "Бот Lucky", time: "09:14", text: "Прикреплён технический контекст со страницы: ExportTimeout, 212 студентов." },
      { kind: "support", who: "Поддержка · Айдана С.", time: "09:31", text: "Здравствуйте, Динара! Вижу таймаут на выгрузке большой группы. Передала разработке, ответим сегодня." },
      { kind: "system", who: "Система", time: "09:32", text: "Приоритет изменён на «Высокий» · Айдана С." },
      { kind: "user", who: "Динара Жумабекова", time: "09:40", text: "Спасибо, жду" },
    ],
    fields: [
      { k: "Организация", v: "Comtehno" },
      { k: "Статус", v: "В работе", editable: true },
      { k: "Приоритет", v: "Высокий", editable: true },
      { k: "Категория", v: "Техническая проблема", editable: true },
      { k: "Источник", v: "Панель управления" },
      { k: "Контакт", v: "d.zhumabekova@comtehno.kg" },
    ],
    history: [
      { text: "Тикет создан", who: "Динара Жумабекова", time: "20 сен, 09:14" },
      { text: "Назначен на Айдану С.", who: "Айдана С.", time: "20 сен, 09:28" },
      { text: "Приоритет изменён: Обычный → Высокий", who: "Айдана С.", time: "20 сен, 09:32" },
      { text: "Статус изменён: Открыто → В работе", who: "Айдана С.", time: "20 сен, 09:32" },
    ],
  },
};

/** Tickets without a hand-written detail get one derived from the list row. */
export function detailFor(t: Ticket): TicketDetail {
  return (
    DETAILS[t.id] ?? {
      created: t.updated,
      author: { initials: initialsOf(t.author), name: t.author, role: `Пользователь · ${t.org}` },
      url: "—",
      techContext: `{\n  "source": "${t.source}",\n  "category": "${t.category}"\n}`,
      messages: [{ kind: "user", who: t.author, time: t.updated, text: t.subject }],
      fields: [
        { k: "Организация", v: t.org },
        { k: "Статус", v: STATUS[t.status].label, editable: true },
        { k: "Приоритет", v: PRIORITY[t.priority].label, editable: true },
        { k: "Категория", v: t.category, editable: true },
        { k: "Источник", v: SOURCE[t.source].label },
      ],
      history: [{ text: "Тикет создан", who: t.author, time: t.updated }],
    }
  );
}

const initialsOf = (name: string) =>
  name
    .replace("@", "")
    .split(/[\s.]+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

/** Dev-backlog tasks that tickets were escalated to (seed state). */
export const INITIAL_ESCALATIONS: Record<string, string> = { "TCK-A3F92KD1": "DEV-412", "TCK-D22MW1J5": "DEV-407" };

export const DEV_TASKS: Record<string, { title: string; status: string }> = {
  "DEV-412": { title: "Таймаут экспорта журнала в PDF для больших групп", status: "В работе" },
  "DEV-407": { title: "Медленный отчёт посещаемости", status: "В работе" },
};

export const slaStrip = { overdue: 2, soon: 2, ok: 17 };
