import { cn, initials } from "../lib";

export function Avatar({ name, className }: { name: string; className?: string }) {
  return (
    <span
      title={name}
      className={cn(
        "inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-brand/10 text-xs font-semibold text-brand",
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}
