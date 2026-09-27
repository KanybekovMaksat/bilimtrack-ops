const dateTime = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});
const number = new Intl.NumberFormat("ru-RU");
const relative = new Intl.RelativeTimeFormat("ru-RU", { numeric: "auto" });

export const formatDateTime = (iso: string) => dateTime.format(new Date(iso));
export const formatNumber = (n: number) => number.format(n);

export function formatRelative(iso: string, now = Date.now()) {
  const diffMin = Math.round((new Date(iso).getTime() - now) / 60_000);
  if (Math.abs(diffMin) < 60) return relative.format(diffMin, "minute");
  const diffHours = Math.round(diffMin / 60);
  if (Math.abs(diffHours) < 24) return relative.format(diffHours, "hour");
  return relative.format(Math.round(diffHours / 24), "day");
}

export const initials = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
