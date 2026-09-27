import { useMockQuery } from "@/shared/api";

export const LICENSE_MODULES = ["Журнал", "Расписание", "Приём", "Финансы", "Чаты", "Геймификация", "Мобильное приложение", "API"];

/** y = on per contract, n = not in contract, p = in contract but off, x = on without contract. */
export type LicenseCell = "y" | "n" | "p" | "x";

export const LICENSE_CELL: Record<LicenseCell, { icon: string; color: string; bg: string; label: string }> = {
  y: { icon: "circle-check-filled", color: "#00a63e", bg: "transparent", label: "Включено по договору" },
  p: { icon: "circle-dashed", color: "#155dfc", bg: "#eff6ff", label: "В договоре, не включено" },
  x: { icon: "alert-triangle", color: "#c2410c", bg: "#fffbeb", label: "Включено вне договора" },
  n: { icon: "minus", color: "#d4d4d4", bg: "transparent", label: "Нет в договоре" },
};

export type OrgLicense = { name: string; slug: string; short: string; pack: string; cells: LicenseCell[] };

const row = (name: string, slug: string, short: string, pack: string, code: string): OrgLicense => ({
  name,
  slug,
  short,
  pack,
  cells: code.split("") as LicenseCell[],
});

const LICENSES: OrgLicense[] = [
  row("МУИТ", "muit", "МУ", "Расширенный", "yyyyyyyp"),
  row("Comtehno", "comtehno", "CT", "Стандарт", "yyyyyyyx"),
  row("НИШ Алматы", "nis-almaty", "НИ", "Расширенный", "yyyyyyyy"),
  row("Школа №61", "school61", "Ш6", "Базовый", "yynnyxpn"),
  row("Колледж «Алатау»", "comtehno", "КА", "Пилот", "yypnynyn"),
  row("Колледж связи", "comtehno", "КС", "Стандарт", "yyyyypyn"),
  row("Гимназия №12", "nis-almaty", "Г1", "Базовый", "yynnynyn"),
];

/** Number of cells that do not match the contract. */
export const licenseDiff = (l: OrgLicense) => l.cells.filter((c) => c === "p" || c === "x").length;

export const LICENSE_PACKS = [
  { name: "Базовый", modules: "Журнал · Расписание · Чаты · Мобильное приложение", count: "12 учреждений" },
  { name: "Стандарт", modules: "Базовый + Приём · Финансы · Геймификация", count: "14 учреждений" },
  { name: "Расширенный", modules: "Стандарт + API и интеграции", count: "6 учреждений" },
  { name: "Пилот", modules: "Набор по соглашению о пилоте, до 60 дней", count: "2 учреждения" },
];

export const useLicenses = () => useMockQuery(["licenses"], () => LICENSES);
