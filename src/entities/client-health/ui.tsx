import { HEALTH_TONE, type HealthTone } from "./model";

export function HealthPill({ tone, onWhite }: { tone: HealthTone; onWhite?: boolean }) {
  const t = HEALTH_TONE[tone];
  return (
    <span
      className="inline-flex items-center gap-[5px] rounded-full px-[9px] py-0.5 text-xs font-medium whitespace-nowrap"
      style={{ background: onWhite ? "#fff" : t.bg, color: t.fg }}
    >
      <span className="size-[7px] rounded-full" style={{ background: t.dot }} />
      {t.label}
    </span>
  );
}
