import { useState } from "react";
import { downloadText, formatInt, toCsv, toIsoDate, type CsvCell } from "../lib";
import { Button } from "./button";

type Loaded<T> = T[] | { rows: T[]; count: number };

type Props<T> = {
  /** File name without the date and extension: «payments» → «payments-2026-09-30.csv». */
  filename: string;
  head: string[];
  /** What to export: the rows already on screen, or a request for every page of the current selection. */
  load: () => Loaded<T> | Promise<Loaded<T>>;
  row: (item: T) => CsvCell[];
};

/** «CSV» in a filter bar: exports the current selection (same filters as the list), not just the visible page. */
export function ExportButton<T>({ filename, head, load, row }: Props<T>) {
  const [state, setState] = useState<{ pending?: boolean; error?: string; note?: string }>({});

  const run = async () => {
    setState({ pending: true });
    try {
      const loaded = await load();
      const rows = Array.isArray(loaded) ? loaded : loaded.rows;
      const total = Array.isArray(loaded) ? rows.length : loaded.count;
      downloadText(`${filename}-${toIsoDate(new Date())}.csv`, toCsv(head, rows.map(row)));
      // The export is capped; say so instead of handing over a silently incomplete file.
      setState(rows.length < total ? { note: `Выгружено ${formatInt(rows.length)} из ${formatInt(total)} — сузьте фильтры` } : {});
    } catch (err) {
      setState({ error: err instanceof Error ? err.message : "Не удалось выгрузить" });
    }
  };

  return (
    <>
      <Button size="md" icon="download" disabled={state.pending} onClick={run} title="Выгрузить текущую выборку в CSV">
        {state.pending ? "Готовим…" : "CSV"}
      </Button>
      {state.error && <span className="text-xs text-red-600">{state.error}</span>}
      {state.note && <span className="text-xs text-warn">{state.note}</span>}
    </>
  );
}
