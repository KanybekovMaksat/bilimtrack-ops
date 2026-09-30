import { describe, expect, it } from "vitest";
import { toCsv } from "./csv";
import { initialsOf, orgShort, plural, sortRows, toIsoDate } from "./index";

describe("plural", () => {
  const forms: [string, string, string] = ["тикет", "тикета", "тикетов"];
  it.each([
    [1, "тикет"],
    [2, "тикета"],
    [5, "тикетов"],
    [11, "тикетов"],
    [14, "тикетов"],
    [21, "тикет"],
    [22, "тикета"],
    [111, "тикетов"],
  ])("%i → %s", (n, word) => expect(plural(n, forms)).toBe(word));
});

describe("sortRows", () => {
  const rows = [
    { name: "Бета", n: 2, at: "2026-03-01" },
    { name: "альфа", n: 10, at: null },
    { name: "Гамма", n: 1, at: "2026-01-15" },
  ];
  const by = { name: (r: (typeof rows)[number]) => r.name, n: (r: (typeof rows)[number]) => r.n, at: (r: (typeof rows)[number]) => r.at };
  const names = (list: typeof rows) => list.map((r) => r.name);

  it("keeps the order without a sort or with an unknown key", () => {
    expect(sortRows(rows, undefined, by)).toBe(rows);
    expect(sortRows(rows, "nope", by)).toBe(rows);
  });

  it("sorts text ignoring case, in both directions", () => {
    expect(names(sortRows(rows, "name", by))).toEqual(["альфа", "Бета", "Гамма"]);
    expect(names(sortRows(rows, "-name", by))).toEqual(["Гамма", "Бета", "альфа"]);
  });

  it("sorts numbers as numbers", () => {
    expect(sortRows(rows, "n", by).map((r) => r.n)).toEqual([1, 2, 10]);
  });

  it("puts empty values last in both directions", () => {
    expect(names(sortRows(rows, "at", by))).toEqual(["Гамма", "Бета", "альфа"]);
    expect(names(sortRows(rows, "-at", by))).toEqual(["Бета", "Гамма", "альфа"]);
  });

  it("does not mutate the input", () => {
    sortRows(rows, "n", by);
    expect(names(rows)).toEqual(["Бета", "альфа", "Гамма"]);
  });
});

describe("toCsv", () => {
  const body = (head: string[], rows: Parameters<typeof toCsv>[1]) => toCsv(head, rows).slice(1);

  it("starts with a BOM and uses ; and CRLF", () => {
    const csv = toCsv(["a", "b"], [[1, "x"]]);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(csv.slice(1)).toBe("a;b\r\n1;x\r\n");
  });

  it("quotes separators, quotes and line breaks", () => {
    expect(body(["v"], [["a;b"], ['say "hi"'], ["two\nlines"]])).toBe('v\r\n"a;b"\r\n"say ""hi"""\r\n"two\nlines"\r\n');
  });

  it("writes empty cells for null / undefined and да/нет for booleans", () => {
    expect(body(["a", "b", "c", "d"], [[null, undefined, true, false]])).toBe("a;b;c;d\r\n;;да;нет\r\n");
  });

  it("neutralises text a spreadsheet would run as a formula", () => {
    expect(body(["v"], [["=HYPERLINK(1)"], ["@cmd"], ["-1+1"], ["+A1"]])).toBe("v\r\n'=HYPERLINK(1)\r\n'@cmd\r\n'-1+1\r\n'+A1\r\n");
  });

  it("leaves phone numbers and plain numbers readable", () => {
    expect(body(["v"], [["+996 (555) 12-34-56"], ["-5"], [-5]])).toBe("v\r\n+996 (555) 12-34-56\r\n-5\r\n-5\r\n");
  });
});

describe("small helpers", () => {
  it("toIsoDate uses the local calendar day", () => {
    expect(toIsoDate(new Date(2026, 0, 5, 23, 59))).toBe("2026-01-05");
  });

  it("orgShort and initialsOf build two-letter marks", () => {
    expect(orgShort("Колледж Comtehno")).toBe("КC");
    expect(initialsOf("Каныбеков Максат")).toBe("КМ");
    expect(initialsOf("m.kanybekov")).toBe("MK");
  });
});
