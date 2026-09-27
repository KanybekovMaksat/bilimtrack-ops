import { useMockQuery } from "@/shared/api";

/** Platform observability: audit trail, sign-in log, service status, staff. */

export type AuditEntry = {
  id: number;
  time: string;
  who: string;
  org: string;
  orgShort: string;
  object: string;
  action: string;
  diff: { field: string; was: string; now: string }[];
};

const d = (field: string, was: string, now: string) => ({ field, was, now });

const AUDIT: AuditEntry[] = [
  { id: 0, time: "20 сен, 15:22", who: "Ернар К.", org: "МУИТ", orgShort: "МУ", object: "Организация · МУИТ", action: "Изменены модули", diff: [d("Модуль «Финансы»", "Включён", "Выключен"), d("Фича «Должники»", "Включена", "Недоступна")] },
  { id: 1, time: "20 сен, 14:05", who: "Айдана С.", org: "МУИТ", orgShort: "МУ", object: "Тикет · TCK-TG7K2M04", action: "Изменён приоритет", diff: [d("Приоритет", "Обычный", "Критический")] },
  { id: 2, time: "20 сен, 11:48", who: "Ернар К.", org: "Comtehno", orgShort: "CT", object: "Аккаунт · d.zhumabekova", action: "Привязан профиль", diff: [d("Членство", "—", "Comtehno, активно"), d("Роли", "—", "Преподаватель")] },
  { id: 3, time: "19 сен, 18:30", who: "Жанна М.", org: "—", orgShort: "—", object: "Статья · Электронный журнал", action: "Опубликована", diff: [d("Статус", "Черновик", "Опубликовано"), d("Дата публикации", "—", "19.09.2026 18:30")] },
  { id: 4, time: "19 сен, 09:10", who: "Айдана С.", org: "Школа №61", orgShort: "Ш6", object: "Подписка · a.kozhabek", action: "Выдан PRO бесплатно", diff: [d("Статус", "Истекла", "Активна"), d("Окончание", "12.08.2026", "12.09.2026"), d("Причина", "—", "компенсация за сбой оплаты")] },
];

export const useAuditLog = () => useMockQuery(["audit"], () => AUDIT);

export type LoginAttempt = { time: string; login: string; ok: boolean; reason: string; ip: string; device: string };

const LOGINS: LoginAttempt[] = [
  { time: "20 сен, 15:40", login: "a.kaliyeva", ok: false, reason: "пользователь не найден", ip: "212.42.101.18", device: "iPhone · Bilimtrack 3.4" },
  { time: "20 сен, 15:39", login: "a.kaliyeva", ok: false, reason: "пользователь не найден", ip: "212.42.101.18", device: "iPhone · Bilimtrack 3.4" },
  { time: "20 сен, 15:02", login: "d.zhumabekova", ok: true, reason: "", ip: "95.56.240.11", device: "Chrome 129 · Windows 11" },
  { time: "20 сен, 14:11", login: "e.kaliyev", ok: true, reason: "", ip: "2.132.14.90", device: "Safari 18 · macOS" },
  { time: "20 сен, 09:04", login: "m.akhmetov", ok: false, reason: "неверный пароль", ip: "37.99.8.214", device: "Android · Bilimtrack 3.4" },
  { time: "19 сен, 22:47", login: "a.serikkyzy", ok: true, reason: "", ip: "95.56.240.11", device: "Chrome 129 · Windows 11" },
];

export const useLoginLog = () => useMockQuery(["logins"], () => LOGINS);

export type ServiceState = "Норма" | "Деградация" | "Сбой";

export const SERVICE_STATE: Record<ServiceState, { dot: string; tone: "success" | "warn" | "danger" }> = {
  Норма: { dot: "#00c951", tone: "success" },
  Деградация: { dot: "#fd9a00", tone: "warn" },
  Сбой: { dot: "#fb2c36", tone: "danger" },
};

const SERVICES: { name: string; state: ServiceState; detail: string }[] = [
  { name: "API", state: "Норма", detail: "p95 210 мс · 0 ошибок за час" },
  { name: "Очередь фоновых задач", state: "Деградация", detail: "1 840 задач в очереди · задержка 6 минут" },
  { name: "Почтовые рассылки", state: "Норма", detail: "отправлено 412 за сутки · 3 отказа" },
  { name: "Telegram-бот", state: "Норма", detail: "последний апдейт 14 секунд назад" },
  { name: "WhatsApp Business", state: "Сбой", detail: "токен истекает 24 сентября · вебхуки не приходят 41 минуту" },
];

export const useSystemStatus = () => useMockQuery(["system"], () => SERVICES);

export type StaffMember = {
  name: string;
  initials: string;
  login: string;
  role: string;
  accountSearch: boolean;
  active: boolean;
  last: string;
};

const TEAM: StaffMember[] = [
  { name: "Айдана Сатыбалды", initials: "АС", login: "a.satybaldy", role: "Поддержка", accountSearch: true, active: true, last: "сейчас" },
  { name: "Ернар Калиев", initials: "ЕК", login: "e.kaliyev", role: "Админ платформы", accountSearch: true, active: true, last: "2 часа назад" },
  { name: "Жанна Мукашева", initials: "ЖМ", login: "zh.mukasheva", role: "Контент", accountSearch: false, active: true, last: "вчера" },
  { name: "Тимур Оспанов", initials: "ТО", login: "t.ospanov", role: "Продажи", accountSearch: false, active: true, last: "вчера" },
  { name: "Марат Сейтов", initials: "МС", login: "m.seitov", role: "Продажи", accountSearch: false, active: false, last: "12 авг" },
];

export const useTeam = () => useMockQuery(["team"], () => TEAM);

export type ErrorLevel = "fatal" | "error" | "warning";
export type ErrorState = "Новая" | "Не решена" | "Решена";

export const ERROR_LEVEL: Record<ErrorLevel, { label: string; bg: string; fg: string }> = {
  fatal: { label: "Fatal", bg: "#fb2c36", fg: "#ffffff" },
  error: { label: "Error", bg: "#fef2f2", fg: "#e7000b" },
  warning: { label: "Warning", bg: "#fffbeb", fg: "#c2410c" },
};

export const ERROR_STATE_COLOR: Record<ErrorState, string> = { Новая: "#155dfc", "Не решена": "#fd9a00", Решена: "#00c951" };

export type ErrorIssue = {
  id: number;
  title: string;
  culprit: string;
  level: ErrorLevel;
  orgs: string[];
  events: string;
  users: string;
  first: string;
  last: string;
  state: ErrorState;
  /** Linked ticket id or dev task key. */
  link: string;
  linkKind: "ticket" | "task" | "";
};

const ISSUES: ErrorIssue[] = [
  { id: 0, title: "AuthError: token refresh failed", culprit: "mobile · auth/refresh", level: "fatal", orgs: ["МУИТ", "НИШ Алматы", "Колледж связи"], events: "301", users: "122", first: "20 сен", last: "1 мин назад", state: "Не решена", link: "TCK-TG7K2M04", linkKind: "ticket" },
  { id: 1, title: "ExportTimeout: превышено время выгрузки журнала", culprit: "api · journal.export_pdf", level: "error", orgs: ["Comtehno", "МУИТ"], events: "412", users: "38", first: "19 сен", last: "4 мин назад", state: "Не решена", link: "DEV-412", linkKind: "task" },
  { id: 2, title: 'TypeError: Cannot read properties of undefined (reading "grade")', culprit: "web · GradebookCell.tsx", level: "error", orgs: ["Школа №61"], events: "186", users: "74", first: "сегодня, 08:12", last: "12 мин назад", state: "Новая", link: "", linkKind: "" },
  { id: 3, title: "IntegrityError: duplicate key schedule_slot", culprit: "api · schedule.import", level: "error", orgs: ["Comtehno"], events: "74", users: "3", first: "вчера", last: "40 мин назад", state: "Новая", link: "", linkKind: "" },
  { id: 4, title: "Slow query: attendance_report дольше 8 с", culprit: "api · reports.attendance", level: "warning", orgs: ["НИШ Алматы"], events: "96", users: "11", first: "17 сен", last: "1 ч назад", state: "Не решена", link: "DEV-407", linkKind: "task" },
  { id: 5, title: "Webhook O!Деньги: 504 Gateway Timeout", culprit: "billing · webhooks.odengi", level: "warning", orgs: ["МУИТ"], events: "23", users: "9", first: "20 сен", last: "2 ч назад", state: "Не решена", link: "TCK-B81LQ2X7", linkKind: "ticket" },
  { id: 6, title: "ChunkLoadError: Loading chunk 412 failed", culprit: "web · app.bundle", level: "error", orgs: ["Школа №61", "Гимназия №12"], events: "40", users: "31", first: "16 сен", last: "вчера", state: "Решена", link: "", linkKind: "" },
];

export const ERRORS_BY_ORG = [
  { org: "Comtehno", n: 486 },
  { org: "МУИТ", n: 318 },
  { org: "Школа №61", n: 226 },
  { org: "НИШ Алматы", n: 132 },
  { org: "Колледж связи", n: 64 },
  { org: "Гимназия №12", n: 58 },
];

export const useErrorIssues = () => useMockQuery(["errors"], () => ISSUES);
