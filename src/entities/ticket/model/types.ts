export type TicketStatus = "open" | "in_progress" | "resolved" | "closed";
export type TicketPriority = "low" | "medium" | "high" | "critical";

export type Ticket = {
  id: string;
  title: string;
  description: string;
  organizationId: string;
  priority: TicketPriority;
  status: TicketStatus;
  assigneeId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TicketFilters = {
  search?: string;
  status?: TicketStatus;
  priority?: TicketPriority;
  organizationId?: string;
};

export type CreateTicketInput = Pick<Ticket, "title" | "description" | "organizationId" | "priority">;
export type UpdateTicketInput = Partial<Pick<Ticket, "status" | "priority" | "assigneeId">>;

export const ticketStatuses: TicketStatus[] = ["open", "in_progress", "resolved", "closed"];
export const ticketPriorities: TicketPriority[] = ["critical", "high", "medium", "low"];

export const ticketStatusLabel: Record<TicketStatus, string> = {
  open: "Открыт",
  in_progress: "В работе",
  resolved: "Решён",
  closed: "Закрыт",
};

export const ticketPriorityLabel: Record<TicketPriority, string> = {
  critical: "Критический",
  high: "Высокий",
  medium: "Средний",
  low: "Низкий",
};
