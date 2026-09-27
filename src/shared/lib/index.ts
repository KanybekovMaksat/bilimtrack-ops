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
const dateTimeFmt = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

/** «12 мар. 2024 г.» or «—». */
export const formatDate = (iso: string | null | undefined) => (iso ? dateFmt.format(new Date(iso)) : "—");

/** «12 мар., 09:41» or «—». */
export const formatDateTimeShort = (iso: string | null | undefined) => (iso ? dateTimeFmt.format(new Date(iso)) : "—");

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
