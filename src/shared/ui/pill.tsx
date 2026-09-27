import type { ReactNode } from "react";
import { cn } from "../lib";
import { Icon } from "./icon";

export type PillTone =
  | "success"
  | "info"
  | "warn"
  | "danger"
  | "neutral"
  | "purple"
  | "orange"
  | "solidBrand"
  | "solidDanger"
  | "white"
  | "plain";

const tones: Record<PillTone, string> = {
  success: "bg-green-50 text-green-600",
  info: "bg-brand-50 text-brand",
  warn: "bg-amber-50 text-warn",
  danger: "bg-red-50 text-red-600",
  neutral: "bg-neutral-100 text-neutral-500",
  purple: "bg-purple-50 text-purple-500",
  orange: "bg-orange-50 text-warn",
  solidBrand: "bg-brand text-white",
  solidDanger: "bg-red-500 text-white",
  white: "bg-white text-warn",
  plain: "bg-transparent text-neutral-500",
};

type PillProps = {
  tone?: PillTone;
  size?: "sm" | "md" | "lg";
  icon?: string;
  dot?: string;
  className?: string;
  children: ReactNode;
};

const sizes = {
  sm: "px-2 py-px text-[11px]",
  md: "px-2.5 py-0.5 text-xs",
  lg: "px-[11px] py-[3px] text-xs",
};

/** Rounded status label — the "badge" of the design system. */
export function Pill({ tone = "neutral", size = "md", icon, dot, className, children }: PillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-[5px] rounded-full font-medium whitespace-nowrap",
        sizes[size],
        tones[tone],
        className,
      )}
    >
      {dot && <span className="size-[7px] shrink-0 rounded-full" style={{ background: dot }} />}
      {icon && <Icon name={icon} size={13} />}
      {children}
    </span>
  );
}

/** Coloured dot followed by a label: used for ticket, task and error statuses. */
export function StatusDot({ color, children, className }: { color: string; children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs text-neutral-700", className)}>
      <span className="size-[7px] shrink-0 rounded-full" style={{ background: color }} />
      {children}
    </span>
  );
}

/** Up/down delta label: "▲ 12%" in green or red. */
export function Delta({ value, good }: { value: string; good: boolean }) {
  return <span className={cn("text-xs font-medium", good ? "text-green-600" : "text-red-600")}>{value}</span>;
}
