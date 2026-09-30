import type { ReactNode } from "react";
import { cn } from "@/shared/lib";
import { Card, CardHeader, Delta, ErrorNote } from "@/shared/ui";

/** Loading / error frame of one report card; renders children once data is there. */
export function ReportCard<T>({
  title,
  subtitle,
  action,
  query,
  height = 180,
  className,
  bodyClassName,
  children,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  query: { data: T | undefined; error: Error | null; isLoading: boolean };
  height?: number;
  className?: string;
  bodyClassName?: string;
  children: (data: T) => ReactNode;
}) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader title={title} subtitle={subtitle} action={action} />
      <div className={cn("p-4", bodyClassName)}>
        {query.error ? (
          <ErrorNote error={query.error} prefix="Отчёт не загрузился" />
        ) : query.data === undefined ? (
          <div className="animate-pulse rounded-xl bg-neutral-50" style={{ height }} />
        ) : (
          children(query.data)
        )}
      </div>
    </Card>
  );
}

/** «+12%» / «−8%»; `lowerIsBetter` flips the colour (bounce rate). */
export function ChangeBadge({ ratio, lowerIsBetter }: { ratio: number | null; lowerIsBetter?: boolean }) {
  if (ratio == null || !Number.isFinite(ratio)) return null;
  const pct = Math.round(ratio * 100);
  if (pct === 0) return <span className="text-xs text-neutral-400">0%</span>;
  const up = pct > 0;
  return <Delta value={`${up ? "+" : "−"}${Math.abs(pct)}%`} good={lowerIsBetter ? !up : up} />;
}

export function Tile({ label, value, change, sub, lowerIsBetter }: { label: string; value: ReactNode; change?: number | null; sub?: ReactNode; lowerIsBetter?: boolean }) {
  return (
    <Card className="flex flex-col gap-1 p-4">
      <div className="text-xs text-neutral-500">{label}</div>
      <div className="flex items-baseline gap-2 whitespace-nowrap">
        <span className="font-num text-[22px] leading-8 font-semibold">{value}</span>
        {change !== undefined && <ChangeBadge ratio={change} lowerIsBetter={lowerIsBetter} />}
      </div>
      {sub && <div className="truncate text-[11px] text-neutral-400">{sub}</div>}
    </Card>
  );
}
