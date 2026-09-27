import type { ReactNode } from "react";
import { cn } from "../lib";
import { Icon, type IconName } from "./icon";

const tones = {
  warn: "border border-amber-500 bg-amber-50 text-ink",
  danger: "border border-red-500 bg-red-50 text-ink",
  dangerSoft: "bg-red-50 text-ink",
  info: "bg-brand-50 text-brand",
  infoBorder: "border border-brand-100 bg-brand-50 text-ink",
  success: "border border-green-500 bg-green-50 text-green-600",
  muted: "bg-neutral-50 text-neutral-600",
  mutedBorder: "border border-neutral-200 bg-neutral-50 text-neutral-700",
};

type CalloutProps = {
  tone?: keyof typeof tones;
  icon?: IconName;
  iconClassName?: string;
  className?: string;
  children: ReactNode;
};

/** Inline notice box: warnings, irreversible-action notes, success toasts. */
export function Callout({ tone = "muted", icon, iconClassName, className, children }: CalloutProps) {
  return (
    <div className={cn("flex gap-2.5 rounded-xl px-3.5 py-3 text-xs leading-[18px]", icon && "items-center", tones[tone], className)}>
      {icon && <Icon name={icon} size={18} className={cn("shrink-0", iconClassName)} />}
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
