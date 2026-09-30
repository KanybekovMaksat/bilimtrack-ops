import { useState, type ReactNode } from "react";
import { cn } from "../lib";

type ColumnChartProps = {
  values: number[];
  /** Label under each column; pass "" to skip one (dense series). */
  labels: string[];
  /** Tooltip text of a column. */
  title?: (value: number, index: number) => string;
  height?: number;
  color?: string;
  /** Index drawn in `accent` (today, the peak). */
  highlight?: number;
  accent?: string;
  className?: string;
};

/** Vertical bars with a hover readout, for daily series and distributions. */
export function ColumnChart({ values, labels, title, height = 150, color = "var(--color-brand-100)", highlight, accent = "var(--color-brand)", className }: ColumnChartProps) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...values);
  const active = hover ?? highlight;
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="h-4 text-right text-[11px] text-neutral-500">{active != null && title ? title(values[active], active) : " "}</div>
      <div className="flex items-end gap-[3px]" style={{ height }} onMouseLeave={() => setHover(null)}>
        {values.map((v, i) => (
          <div key={i} className="flex h-full flex-1 cursor-default items-end" onMouseEnter={() => setHover(i)} title={title?.(v, i)}>
            <div
              className="w-full rounded-[4px_4px_1px_1px] transition-[background]"
              style={{ height: `${Math.max(v ? 3 : 1, (v / max) * 100)}%`, background: i === active ? accent : v ? color : "var(--color-neutral-100)" }}
            />
          </div>
        ))}
      </div>
      <div className="flex gap-[3px] text-[10px] text-neutral-400">
        {labels.map((l, i) => (
          <span key={i} className="min-w-0 flex-1 overflow-visible text-center whitespace-nowrap">
            {l}
          </span>
        ))}
      </div>
    </div>
  );
}

type HeatGridProps = {
  rowLabels: string[];
  colLabels: string[];
  /** values[row][col] */
  values: number[][];
  title?: (value: number, row: number, col: number) => string;
  className?: string;
};

/** Intensity grid (weekday × hour); cell opacity follows the value against the maximum. */
export function HeatGrid({ rowLabels, colLabels, values, title, className }: HeatGridProps) {
  const max = Math.max(1, ...values.flat());
  return (
    <div className={cn("grid items-center gap-[3px]", className)} style={{ gridTemplateColumns: `28px repeat(${colLabels.length}, minmax(0, 1fr))` }}>
      <span />
      {colLabels.map((c, i) => (
        <span key={i} className="text-center text-[10px] text-neutral-400">
          {c}
        </span>
      ))}
      {rowLabels.map((r, row) => (
        <HeatRow key={r} label={r}>
          {values[row].map((v, col) => (
            <span
              key={col}
              title={title?.(v, row, col)}
              className="h-5 rounded-[4px]"
              style={{ background: v ? `color-mix(in oklab, var(--color-brand) ${Math.round(12 + (v / max) * 88)}%, white)` : "var(--color-neutral-50)" }}
            />
          ))}
        </HeatRow>
      ))}
    </div>
  );
}

function HeatRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <span className="text-[11px] text-neutral-500">{label}</span>
      {children}
    </>
  );
}

type BarListProps = {
  rows: { key: string; label: ReactNode; value: number; hint?: ReactNode }[];
  format?: (value: number) => string;
  color?: string;
  className?: string;
};

/** Ranked horizontal bars: label, bar against the leader, value. */
export function BarList({ rows, format = String, color = "var(--color-brand)", className }: BarListProps) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <div className={cn("flex flex-col gap-2.5", className)}>
      {rows.map((r) => (
        <div key={r.key} className="flex flex-col gap-1">
          <div className="flex items-baseline justify-between gap-3 text-[13px]">
            <span className="min-w-0 truncate">{r.label}</span>
            <span className="flex shrink-0 items-baseline gap-2">
              {r.hint && <span className="text-[11px] text-neutral-400">{r.hint}</span>}
              <span className="font-num font-semibold">{format(r.value)}</span>
            </span>
          </div>
          <span className="block h-1.5 overflow-hidden rounded-full bg-neutral-100">
            <span className="block h-full rounded-full" style={{ width: `${(r.value / max) * 100}%`, background: color }} />
          </span>
        </div>
      ))}
    </div>
  );
}
