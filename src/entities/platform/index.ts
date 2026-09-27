import { useSuspenseQuery } from "@tanstack/react-query";
import { api, HEALTH_URL, QK, useMockQuery } from "@/shared/api";
import { formatDateTimeFull } from "@/shared/lib";

/** Platform observability: service status and errors. Audit, sign-ins and the team live in `journal` and `operator`. */

export type ServiceState = "Норма" | "Деградация" | "Сбой";

export const SERVICE_STATE: Record<ServiceState, { dot: string; tone: "success" | "warn" | "danger" }> = {
  Норма: { dot: "var(--color-green-500)", tone: "success" },
  Деградация: { dot: "var(--color-amber-500)", tone: "warn" },
  Сбой: { dot: "var(--color-red-500)", tone: "danger" },
};

type SystemService = { name: string; state: ServiceState; detail: string };

const HEALTH_NAMES: Record<string, string> = { Cache: "Кэш (Redis)", Database: "База данных (PostgreSQL)", Storage: "Файловое хранилище" };

/**
 * Live status from the backend: public `system/status/` (maintenance mode) and
 * django-health-check `/health/` (database, cache, storage). Polled every 30 s.
 */
async function fetchSystemStatus(): Promise<{ services: SystemService[]; checkedAt: string }> {
  const started = performance.now();
  const services: SystemService[] = [];
  try {
    const status = await api<{ maintenance: boolean; estimatedEnd: string | null; message: string }>("system/status/");
    const ms = Math.round(performance.now() - started);
    services.push({ name: "API", state: "Норма", detail: `отвечает за ${ms} мс` });
    services.push(
      status.maintenance
        ? { name: "Режим обслуживания", state: "Деградация", detail: status.message || `включён${status.estimatedEnd ? ` до ${formatDateTimeFull(status.estimatedEnd)}` : ""}` }
        : { name: "Режим обслуживания", state: "Норма", detail: "выключен, пользователи работают как обычно" },
    );
  } catch (e) {
    services.push({ name: "API", state: "Сбой", detail: e instanceof Error ? e.message : "не отвечает" });
  }
  try {
    const res = await fetch(HEALTH_URL, { headers: { Accept: "application/json" } });
    const body = (await res.json()) as Record<string, string>;
    for (const [key, value] of Object.entries(body)) {
      const name = HEALTH_NAMES[key.split("(")[0]] ?? key;
      services.push({ name, state: value === "OK" ? "Норма" : "Сбой", detail: value === "OK" ? "проверка пройдена" : value });
    }
  } catch {
    services.push({ name: "Проверки инфраструктуры", state: "Сбой", detail: "/health/ не ответил" });
  }
  return { services, checkedAt: new Date().toISOString() };
}

export const useSystemStatus = () =>
  useSuspenseQuery({ queryKey: [QK.systemStatus], queryFn: fetchSystemStatus, refetchInterval: 30_000, staleTime: 0 }).data;

export type ErrorLevel = "fatal" | "error" | "warning";
export type ErrorState = "Новая" | "Не решена" | "Решена";

export const ERROR_LEVEL: Record<ErrorLevel, { label: string; bg: string; fg: string }> = {
  fatal: { label: "Fatal", bg: "var(--color-red-500)", fg: "var(--color-white)" },
  error: { label: "Error", bg: "var(--color-red-50)", fg: "var(--color-red-600)" },
  warning: { label: "Warning", bg: "var(--color-amber-50)", fg: "var(--color-warn)" },
};

export const ERROR_STATE_COLOR: Record<ErrorState, string> = { Новая: "var(--color-brand)", "Не решена": "var(--color-amber-500)", Решена: "var(--color-green-500)" };

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
