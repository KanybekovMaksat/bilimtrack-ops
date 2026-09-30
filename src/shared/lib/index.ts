import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

/** Russian plural form: plural(5, ["учреждение", "учреждения", "учреждений"]). */
export function plural(n: number, [one, few, many]: [string, string, string]) {
  const n10 = n % 10;
  const n100 = n % 100;
  if (n10 === 1 && n100 !== 11) return one;
  if (n10 >= 2 && n10 <= 4 && (n100 < 12 || n100 > 14)) return few;
  return many;
}

type SortValue = string | number | null | undefined;

/**
 * Orders rows for a sortable `Table`: `sort` is a column key, `-key` for descending; an unknown key keeps the order.
 * Empty values always go last; ISO dates compare as strings.
 */
export function sortRows<T>(rows: T[], sort: string | undefined, by: Record<string, (row: T) => SortValue>): T[] {
  if (!sort) return rows;
  const desc = sort.startsWith("-");
  const get = by[desc ? sort.slice(1) : sort];
  if (!get) return rows;
  const empty = (v: SortValue) => v === null || v === undefined || v === "";
  return [...rows].sort((a, b) => {
    const x = get(a);
    const y = get(b);
    if (empty(x) || empty(y)) return Number(empty(x)) - Number(empty(y));
    const c = typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y), "ru", { numeric: true });
    return desc ? -c : c;
  });
}

export const toggleIn = <T,>(list: T[], value: T) =>
  list.includes(value) ? list.filter((x) => x !== value) : [...list, value];

/** Turns a numeric series into SVG polyline points. */
export function toPoints(data: number[], width: number, y: (v: number) => number) {
  return data.map((v, i) => `${((i * width) / (data.length - 1)).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
}

/** Two-letter mark of an organisation name: «Колледж Comtehno» → «КО». */
export const orgShort = (name: string) =>
  name
    .replace(/[«»"'№()]/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase() || "?";

/** Initials of a full name or login: «Каныбеков Максат» → «КМ», «m.kanybekov» → «MK». */
export const initialsOf = (s: string) =>
  s
    .replace(/[^a-zA-Zа-яА-ЯёЁ\s._-]/g, "")
    .split(/[\s._-]+/)
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "?";

const dateFmt = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short", year: "numeric" });
const dateLongFmt = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric" });
const dateTimeFmt = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
const dateTimeFullFmt = new Intl.DateTimeFormat("ru-RU", { dateStyle: "short", timeStyle: "medium" });
const dayMonthFmt = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short" });
const dayMonthYearFmt = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short", year: "numeric" });
const weekdayFmt = new Intl.DateTimeFormat("ru-RU", { weekday: "long", day: "numeric", month: "long" });
const timeFmt = new Intl.DateTimeFormat("ru-RU", { hour: "2-digit", minute: "2-digit" });
const timeSecFmt = new Intl.DateTimeFormat("ru-RU", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

type DateInput = string | number | Date;

/** Local calendar day as `YYYY-MM-DD` — the value of a date input and of date filters in the API. */
export const toIsoDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** «12 мар. 2024 г.» or «—». */
export const formatDate = (iso: string | null | undefined) => (iso ? dateFmt.format(new Date(iso)) : "—");

/** «12 марта 2024 г.» or `empty`. */
export const formatDateLong = (iso: string | null | undefined, empty = "—") => (iso ? dateLongFmt.format(new Date(iso)) : empty);

/** «12 мар., 09:41» or «—». */
export const formatDateTimeShort = (iso: string | null | undefined) => (iso ? dateTimeFmt.format(new Date(iso)) : "—");

/** «12.03.2024, 09:41:05» — exact moment, for tooltips. */
export const formatDateTimeFull = (d: DateInput) => dateTimeFullFmt.format(new Date(d));

/** «12 мар.» */
export const formatDayMonth = (d: DateInput) => dayMonthFmt.format(new Date(d));

/** «понедельник, 28 сентября». */
export const formatWeekdayDate = (d: DateInput) => weekdayFmt.format(new Date(d));

/** «09:41», or «09:41:05» with `seconds`. */
export const formatTime = (d: DateInput, seconds = false) => (seconds ? timeSecFmt : timeFmt).format(new Date(d));

const MIN = 60_000;

/** «только что», «5 мин назад», «3 ч назад» (today), «вчера, 18:40», «18 сент.», «18 сент. 2025 г.» (another year). */
export function formatRelative(iso: string, now = Date.now()) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const diff = now - d.getTime();
  if (diff < MIN) return "только что";
  if (diff < 60 * MIN) return `${Math.round(diff / MIN)} мин назад`;
  if (new Date(now).toDateString() === d.toDateString()) return `${Math.round(diff / (60 * MIN))} ч назад`;
  if (new Date(now - 24 * 60 * MIN).toDateString() === d.toDateString()) return `вчера, ${timeFmt.format(d)}`;
  return (d.getFullYear() === new Date(now).getFullYear() ? dayMonthFmt : dayMonthYearFmt).format(d);
}

/** «3 часа назад», «вчера», «22 дня назад» — for activity columns. */
export function formatAgo(iso: string | null | undefined, now = Date.now()) {
  if (!iso) return "нет входов";
  const diff = now - new Date(iso).getTime();
  const min = Math.round(diff / 60_000);
  if (min < 1) return "только что";
  if (min < 60) return `${min} ${plural(min, ["минуту", "минуты", "минут"])} назад`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h} ${plural(h, ["час", "часа", "часов"])} назад`;
  const d = Math.round(h / 24);
  if (d === 1) return "вчера";
  return `${d} ${plural(d, ["день", "дня", "дней"])} назад`;
}

/** Whole days since the date (null — never). */
export const daysSince = (iso: string | null | undefined, now = Date.now()) =>
  iso ? Math.floor((now - new Date(iso).getTime()) / 86_400_000) : null;

export const formatInt = (n: number) => n.toLocaleString("ru-RU");

/** Local calendar date as «2026-09-30» (what `<input type="date">` and date query params take), `days` from `d`. */
export function isoDate(d: DateInput = Date.now(), days = 0) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
}

/** Active time: «42 сек», «8 мин 42 сек», «1 ч 05 мин», «—» for null. */
export function formatDuration(seconds: number | null | undefined) {
  if (seconds == null) return "—";
  const s = Math.max(0, Math.round(seconds));
  if (s < 60) return `${s} сек`;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h) return `${h} ч ${String(m).padStart(2, "0")} мин`;
  return `${m} мин ${s % 60} сек`;
}

/** Ratio 0..1 as «42%» (one decimal under 10%), «—» for null. */
export function formatPercent(ratio: number | null | undefined) {
  if (ratio == null) return "—";
  const p = ratio * 100;
  return `${p > 0 && p < 10 ? p.toFixed(1).replace(".", ",") : Math.round(p)}%`;
}

/** «1 234,5» — up to `fractionDigits` decimals. */
export const formatNumber = (n: number, fractionDigits = 2) => n.toLocaleString("ru-RU", { maximumFractionDigits: fractionDigits });

/** «340 КБ», «2.4 МБ». */
export const formatBytes = (bytes: number) =>
  bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} МБ` : `${Math.max(1, Math.round(bytes / 1024))} КБ`;

export { downloadText, toCsv, type CsvCell } from "./csv";
export { useDebouncedEffect } from "./use-debounced-effect";
export { useUrlFilters, useUrlSearch, type UrlFilters } from "./use-url-filters";
