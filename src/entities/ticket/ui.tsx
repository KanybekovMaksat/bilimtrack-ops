import { Icon, StatusDot } from "@/shared/ui";
import { PRIORITY, SLA_STYLE, SOURCE, STATUS, type Ticket, type TicketPriority, type TicketStatus } from "./model";

export function PriorityPill({ priority, compact }: { priority: TicketPriority; compact?: boolean }) {
  const p = PRIORITY[priority] ?? PRIORITY.normal;
  return (
    <span
      className={`inline-flex items-center gap-[5px] rounded-full text-xs whitespace-nowrap ${compact ? "px-[9px] py-px" : "px-[9px] py-0.5"}`}
      style={{ background: p.bg, color: p.fg, fontWeight: p.weight }}
    >
      {p.dot && <span className="size-1.5 rounded-full" style={{ background: p.fg }} />}
      {p.label}
    </span>
  );
}

export function TicketStatusLabel({ status, className }: { status: TicketStatus; className?: string }) {
  const s = STATUS[status] ?? STATUS.open;
  return (
    <StatusDot color={s.color} className={className}>
      {s.label}
    </StatusDot>
  );
}

export function SlaPill({ sla, prefix }: { sla: Ticket["sla"]; prefix?: string }) {
  const s = SLA_STYLE[sla.state];
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs whitespace-nowrap"
      style={{ background: s.bg, color: s.fg, fontWeight: s.weight }}
    >
      <Icon name="clock" size={13} />
      {prefix}
      {sla.label}
    </span>
  );
}

export function SourceLabel({ source }: { source: Ticket["source"] }) {
  const s = SOURCE[source] ?? SOURCE.api;
  return (
    <span className="flex items-center gap-[5px] text-xs text-neutral-500">
      <Icon name={s.icon} size={15} style={{ color: s.color }} />
      {s.label}
    </span>
  );
}
