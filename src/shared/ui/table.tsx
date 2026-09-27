import { createContext, useContext, type CSSProperties, type ReactNode } from "react";
import { cn } from "../lib";

type Grid = { cols: string; minWidth?: number; gap: number };
const GridContext = createContext<Grid>({ cols: "1fr", gap: 12 });

type TableProps = {
  /** CSS grid-template-columns shared by the header and every row. */
  cols: string;
  minWidth?: number;
  gap?: number;
  head?: ReactNode[];
  headAlign?: ("left" | "center" | "right")[];
  className?: string;
  children: ReactNode;
};

/** Grid-based data table from the design: grey header, hairline rows. */
export function Table({ cols, minWidth, gap = 12, head, headAlign, className, children }: TableProps) {
  return (
    <GridContext.Provider value={{ cols, minWidth, gap }}>
      <div className={cn("overflow-auto rounded-xl border border-neutral-200", className)}>
        {head && (
          <div
            className="grid items-end border-b border-neutral-200 bg-neutral-50 px-3.5 py-[9px] text-[11px] font-semibold text-neutral-500"
            style={{ gridTemplateColumns: cols, minWidth, gap }}
          >
            {head.map((h, i) => (
              <span key={i} style={{ textAlign: headAlign?.[i] }}>
                {h}
              </span>
            ))}
          </div>
        )}
        {children}
      </div>
    </GridContext.Provider>
  );
}

type RowProps = {
  onClick?: () => void;
  /** Hover highlight without a click action. */
  hover?: boolean;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
};

export function Row({ onClick, hover, className, style, children }: RowProps) {
  const { cols, minWidth, gap } = useContext(GridContext);
  return (
    <div
      onClick={onClick}
      className={cn(
        "grid items-center border-b border-neutral-100 px-3.5 py-2.5 text-[13px] last:border-b-0",
        (onClick || hover) && "hover:bg-neutral-50",
        onClick && "cursor-pointer",
        className,
      )}
      style={{ gridTemplateColumns: cols, minWidth, gap, ...style }}
    >
      {children}
    </div>
  );
}

/** Truncating cell. */
export function Cell({ className, children, title }: { className?: string; children: ReactNode; title?: string }) {
  return (
    <span title={title} className={cn("min-w-0 truncate", className)}>
      {children}
    </span>
  );
}

/** Numeric cell set in Inter like the design's tabular figures. */
export function Num({ className, children }: { className?: string; children: ReactNode }) {
  return <span className={cn("font-num text-xs", className)}>{children}</span>;
}
