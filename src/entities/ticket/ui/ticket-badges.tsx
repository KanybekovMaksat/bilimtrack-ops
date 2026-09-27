import { Badge, type Tone } from "@/shared/ui";
import {
  ticketPriorityLabel,
  ticketStatusLabel,
  type TicketPriority,
  type TicketStatus,
} from "../model/types";

const statusTone: Record<TicketStatus, Tone> = {
  open: "brand",
  in_progress: "warning",
  resolved: "success",
  closed: "neutral",
};

const priorityTone: Record<TicketPriority, Tone> = {
  critical: "danger",
  high: "warning",
  medium: "brand",
  low: "neutral",
};

export function TicketStatusBadge({ status }: { status: TicketStatus }) {
  return <Badge tone={statusTone[status]}>{ticketStatusLabel[status]}</Badge>;
}

export function TicketPriorityBadge({ priority }: { priority: TicketPriority }) {
  return <Badge tone={priorityTone[priority]}>{ticketPriorityLabel[priority]}</Badge>;
}
