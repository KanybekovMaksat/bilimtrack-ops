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
