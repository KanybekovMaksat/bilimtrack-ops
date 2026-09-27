import { cn } from "../lib";
import { Icon } from "./icon";

const markFont: Record<number, number> = { 16: 8, 18: 9, 20: 9, 22: 10, 24: 10, 52: 17 };
const markRadius: Record<number, number> = { 16: 5, 18: 5, 20: 6, 22: 6, 24: 7, 52: 14 };

/** Square two-letter organisation mark ("МУ", "CT"). */
export function OrgMark({ short, size = 18, className }: { short: string; size?: number; className?: string }) {
  return (
    <span
      className={cn("inline-flex shrink-0 items-center justify-center bg-neutral-100 font-semibold text-neutral-500", className)}
      style={{ width: size, height: size, fontSize: markFont[size] ?? 10, borderRadius: markRadius[size] ?? 6 }}
    >
      {short}
    </span>
  );
}

/** Org mark followed by the organisation name, truncated. */
export function OrgLabel({ short, name, size = 18, className }: { short: string; name: string; size?: number; className?: string }) {
  return (
    <span className={cn("flex min-w-0 items-center gap-1.5", className)}>
      <OrgMark short={short} size={size} />
      <span className="truncate text-neutral-700">{name}</span>
    </span>
  );
}

type AvatarProps = {
  initials?: string;
  icon?: string;
  size?: number;
  tone?: "neutral" | "brand";
  className?: string;
};

/** Round avatar with initials or an icon. */
export function Avatar({ initials, icon, size = 26, tone = "neutral", className }: AvatarProps) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold",
        tone === "brand" ? "bg-brand-50 text-brand" : "bg-neutral-100 text-neutral-500",
        className,
      )}
      style={{ width: size, height: size, fontSize: Math.max(9, Math.round(size * 0.36)) }}
    >
      {icon ? <Icon name={icon} size={Math.round(size * 0.5)} /> : initials}
    </span>
  );
}
