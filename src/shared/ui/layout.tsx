import { Fragment, type ReactNode } from "react";
import { Link } from "react-router";
import { cn } from "../lib";
import { Icon, type IconName } from "./icon";

type PageHeaderProps = { title: ReactNode; subtitle?: ReactNode; actions?: ReactNode; className?: string };

export function PageHeader({ title, subtitle, actions, className }: PageHeaderProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <h1 className="m-0 text-xl leading-[26px] font-semibold tracking-[-.01em]">{title}</h1>
      {subtitle && <span className="text-[13px] text-neutral-400">{subtitle}</span>}
      {actions && (
        <>
          <div className="flex-1" />
          {actions}
        </>
      )}
    </div>
  );
}

export function PageTitle({ children, className }: { children: ReactNode; className?: string }) {
  return <h1 className={cn("m-0 text-xl leading-[26px] font-semibold tracking-[-.01em]", className)}>{children}</h1>;
}

type Crumb = { label: ReactNode; to?: string; numeric?: boolean };

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav className="flex items-center gap-2 text-[13px] text-neutral-400">
      {items.map((c, i) => (
        <Fragment key={i}>
          {i > 0 && <Icon name="chevron-right" size={14} />}
          {c.to ? (
            <Link to={c.to} className="text-brand">
              {c.label}
            </Link>
          ) : (
            <span className={cn(c.numeric && "font-num")}>{c.label}</span>
          )}
        </Fragment>
      ))}
    </nav>
  );
}

type EmptyStateProps = {
  icon: IconName;
  iconClassName?: string;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  dashed?: boolean;
  className?: string;
};

export function EmptyState({ icon, iconClassName, title, description, action, dashed, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-2.5 p-14 text-center",
        dashed && "rounded-2xl border border-dashed border-neutral-200 p-10",
        className,
      )}
    >
      <Icon name={icon} size={34} className={cn("text-neutral-300", iconClassName)} />
      <div className="text-[15px] font-medium">{title}</div>
      {description && <div className="max-w-[400px] text-[13px] leading-[19px] text-neutral-500">{description}</div>}
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}

/** Rounded horizontal meter. */
export function Meter({ value, color, height = 6, className }: { value: number; color: string; height?: number; className?: string }) {
  return (
    <span className={cn("block overflow-hidden rounded-full bg-neutral-100", className)} style={{ height }}>
      <span className="block h-full rounded-full" style={{ width: `${value}%`, background: color }} />
    </span>
  );
}

type LineChartProps = {
  width: number;
  height: number;
  /** y positions of horizontal guides; the last one is drawn darker as a baseline. */
  guides: number[];
  series: { points: string; color: string }[];
};

export function LineChart({ width, height, guides, series }: LineChartProps) {
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="block w-full" style={{ height }} preserveAspectRatio="none">
      {guides.map((y, i) => (
        <line key={y} x1="0" y1={y} x2={width} y2={y} stroke={i === guides.length - 1 ? "var(--color-neutral-200)" : "var(--color-neutral-100)"} />
      ))}
      {series.map((s, i) => (
        <polyline key={i} points={s.points} fill="none" stroke={s.color} strokeWidth="2" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      ))}
    </svg>
  );
}

/** Suspense fallback shaped like a list page. */
export function PageSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-label="Загрузка">
      <div className="h-[26px] w-56 rounded-full bg-neutral-100" />
      <div className="overflow-hidden rounded-xl border border-neutral-200">
        <div className="h-[34px] border-b border-neutral-200 bg-neutral-50" />
        {[62, 48, 80, 55, 70, 44].map((w, i) => (
          <div key={i} className="flex gap-3 border-b border-neutral-100 p-3.5">
            <span className="h-2.5 w-24 rounded-full bg-neutral-100" />
            <span className="h-2.5 rounded-full bg-neutral-100" style={{ width: `${w}%` }} />
          </div>
        ))}
      </div>
    </div>
  );
}
