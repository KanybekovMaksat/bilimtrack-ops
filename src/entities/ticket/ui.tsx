import { Icon, StatusDot } from "@/shared/ui";
import { PRIORITY, SLA_STYLE, SOURCE, STATUS, type Ticket, type TicketPriority, type TicketStatus } from "./model";

export function PriorityPill({ priority, compact }: { priority: TicketPriority; compact?: boolean }) {
  const p = PRIORITY[priority];
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

export function TicketStatusLabel({ status }: { status: TicketStatus }) {
  const s = STATUS[status];
  return <StatusDot color={s.color}>{s.label}</StatusDot>;
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
  const s = SOURCE[source];
  return (
    <span className="flex items-center gap-[5px] text-xs text-neutral-500">
      <Icon name={s.icon} size={15} style={{ color: s.color }} />
      {s.label}
    </span>
  );
}

/** "DEV-412" chip shown next to a ticket subject once it is escalated. */
export function EscalationTag({ taskKey }: { taskKey: string }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-[3px] rounded-full bg-brand-50 px-[7px] py-px text-[11px] font-medium text-brand">
      <Icon name="git-pull-request" size={12} />
      {taskKey}
    </span>
  );
}
