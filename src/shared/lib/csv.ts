export type CsvCell = string | number | boolean | null | undefined;

/**
 * One CSV cell. Text that a spreadsheet would run as a formula (`=`, `+`, `-`, `@` first) gets a leading
 * apostrophe: names and ticket subjects come from users, and an export must not execute them.
 */
function cell(v: CsvCell) {
  if (v === null || v === undefined) return "";
  const raw = typeof v === "boolean" ? (v ? "да" : "нет") : String(v);
  // A phone («+996 555 …») or a plain signed number is not a formula: leave it readable.
  const risky = typeof v === "string" && /^[=+\-@\t\r]/.test(raw) && !/^[+-][\d\s().-]*$/.test(raw);
  const safe = risky ? `'${raw}` : raw;
  return /[";\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

const BOM = String.fromCharCode(0xfeff);

/** CSV text: `;` separator and a BOM, which is what Excel with a Russian locale opens without an import wizard. */
export const toCsv = (head: string[], rows: CsvCell[][]) => `${BOM}${[head, ...rows].map((r) => r.map(cell).join(";")).join("\r\n")}\r\n`;

/** Saves text as a file from the browser. */
export function downloadText(filename: string, text: string, type = "text/csv;charset=utf-8") {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
