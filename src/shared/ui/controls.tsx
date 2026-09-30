import type { ReactNode } from "react";
import { cn } from "../lib";
import { Icon, type IconName } from "./icon";

type ToggleProps = {
  on: boolean;
  onChange?: (on: boolean) => void;
  size?: "sm" | "md";
  /** Greyed out: the parent module is off. */
  disabled?: boolean;
  label?: string;
};

export function Toggle({ on, onChange, size = "md", disabled, label }: ToggleProps) {
  const md = size === "md";
  return (
    <button
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onChange?.(!on);
      }}
      className={cn(
        "relative shrink-0 rounded-full border-0 p-0 transition-colors",
        md ? "h-[22px] w-[38px]" : "h-[18px] w-[30px]",
        disabled ? "cursor-default bg-neutral-100" : on ? "bg-brand" : "bg-neutral-300",
        !onChange && "cursor-default",
      )}
    >
      <span
        className={cn("absolute top-0.5 rounded-full bg-white transition-[left]", md ? "size-[18px]" : "size-3.5")}
        style={{ left: on && !disabled ? (md ? 18 : 14) : 2 }}
      />
    </button>
  );
}

type FilterChipProps = {
  label: ReactNode;
  tone?: "default" | "active" | "warn" | "danger";
  icon: IconName;
  onClick?: () => void;
};

const chipTones = {
  default: "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300",
  active: "border-brand bg-brand-50 text-brand",
  warn: "border-amber-500 bg-amber-50 text-warn",
  danger: "border-red-500 bg-red-50 text-red-600",
};

/** Quick on/off filter («Только неудачные»). A filter with a list of values is `FilterSelect`. */
export function FilterChip({ label, tone = "default", icon, onClick }: FilterChipProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex h-[34px] items-center gap-1.5 rounded-full border px-3 text-[13px] font-medium whitespace-nowrap",
        chipTones[tone],
      )}
    >
      <Icon name={icon} size={16} />
      {label}
    </button>
  );
}

/** Multi-select chip with a check / plus glyph. */
export function ToggleChip({ on, label, onClick, icon }: { on: boolean; label: ReactNode; onClick: () => void; icon?: IconName }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex h-8 items-center gap-1.5 rounded-full border px-3 text-[13px] font-medium",
        on ? "border-brand bg-brand-50 text-brand" : "border-neutral-200 bg-white text-neutral-700",
      )}
    >
      <Icon name={icon ?? (on ? "check" : "plus")} size={15} />
      {label}
    </button>
  );
}

type SearchInputProps = {
  placeholder: string;
  value?: string;
  onChange?: (v: string) => void;
  width?: number;
  className?: string;
};

export function SearchInput({ placeholder, value, onChange, width = 240, className }: SearchInputProps) {
  return (
    <label
      className={cn("flex h-[34px] items-center gap-2 rounded-full bg-neutral-100 px-3.5 text-[13px]", className)}
      style={{ width }}
    >
      <Icon name="search" size={16} className="text-neutral-400" />
      <input
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        className="min-w-0 flex-1 border-0 bg-transparent font-sans text-[13px] outline-none placeholder:text-neutral-400"
      />
    </label>
  );
}

/** Square checkbox used for multi-select rows. */
export function CheckBox({ on }: { on: boolean }) {
  return (
    <span
      className={cn(
        "flex size-[18px] items-center justify-center rounded-[5px] border",
        on ? "border-brand bg-brand" : "border-neutral-300 bg-white",
      )}
    >
      <Icon name="check" size={13} className={cn("text-white", !on && "opacity-0")} />
    </span>
  );
}
