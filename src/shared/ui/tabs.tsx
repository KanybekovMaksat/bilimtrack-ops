import type { ReactNode } from "react";
import { cn } from "../lib";
import { Icon } from "./icon";

export type TabItem<K extends string> = { key: K; label: ReactNode; count?: number | string };

type TabsProps<K extends string> = {
  items: TabItem<K>[];
  value: K;
  onChange: (key: K) => void;
  /** "pill" renders the count as a badge, "text" as muted text. */
  countStyle?: "pill" | "text";
  stretch?: boolean;
  className?: string;
};

/** Underlined tab strip. */
export function Tabs<K extends string>({ items, value, onChange, countStyle = "pill", stretch, className }: TabsProps<K>) {
  return (
    <div className={cn("flex gap-0.5 border-b border-neutral-200", stretch && "gap-0 border-neutral-100", className)}>
      {items.map((t) => {
        const on = t.key === value;
        return (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            className={cn(
              "-mb-px flex items-center justify-center gap-[7px] border-0 border-b-2 bg-transparent font-medium",
              stretch ? "flex-1 py-[11px] text-[13px]" : "px-3.5 py-[9px] text-sm",
              on ? "border-brand text-ink" : "border-transparent text-neutral-500",
            )}
          >
            {t.label}
            {t.count != null &&
              (countStyle === "pill" ? (
                <span
                  className={cn(
                    "rounded-full px-[7px] py-px text-[11px] font-semibold",
                    on ? "bg-brand text-white" : "bg-neutral-100 text-neutral-500",
                  )}
                >
                  {t.count}
                </span>
              ) : (
                <span className="text-[11px] text-neutral-400">{t.count}</span>
              ))}
          </button>
        );
      })}
    </div>
  );
}

export type SegmentOption<K extends string> = { value: K; label: ReactNode; icon?: string; iconColor?: string };

type SegmentedProps<K extends string> = {
  options: SegmentOption<K>[];
  value: K;
  onChange: (value: K) => void;
  size?: "sm" | "md";
  stretch?: boolean;
  className?: string;
};

/** Pill-shaped segmented control on a grey track. */
export function Segmented<K extends string>({ options, value, onChange, size = "md", stretch, className }: SegmentedProps<K>) {
  return (
    <div className={cn("flex gap-1 self-start rounded-full bg-neutral-100 p-[3px]", stretch && "self-stretch", className)}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-full border-0 font-medium whitespace-nowrap",
              size === "sm" ? "px-0 py-[5px] text-xs" : "px-3.5 py-1.5 text-[13px]",
              stretch && "flex-1",
              on ? "bg-white text-ink shadow-seg" : "bg-transparent text-neutral-500",
            )}
          >
            {o.icon && <Icon name={o.icon} size={15} style={{ color: o.iconColor }} />}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
