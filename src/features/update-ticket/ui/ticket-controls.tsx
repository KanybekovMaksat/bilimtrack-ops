import { useEmployees } from "@/entities/employee";
import {
  ticketPriorities,
  ticketPriorityLabel,
  ticketStatuses,
  ticketStatusLabel,
  type Ticket,
  type TicketPriority,
  type TicketStatus,
} from "@/entities/ticket";
import { Label, Select } from "@/shared/ui";
import { useUpdateTicket } from "../model/use-update-ticket";

export function TicketControls({ ticket }: { ticket: Ticket }) {
  const { mutate, isPending } = useUpdateTicket(ticket.id);
  const { data: employees = [] } = useEmployees();

  return (
    <div className="flex flex-col gap-4">
      <Label text="Статус">
        <Select value={ticket.status} disabled={isPending} onChange={(e) => mutate({ status: e.target.value as TicketStatus })}>
          {ticketStatuses.map((s) => (
            <option key={s} value={s}>{ticketStatusLabel[s]}</option>
          ))}
        </Select>
      </Label>
      <Label text="Приоритет">
        <Select value={ticket.priority} disabled={isPending} onChange={(e) => mutate({ priority: e.target.value as TicketPriority })}>
          {ticketPriorities.map((p) => (
            <option key={p} value={p}>{ticketPriorityLabel[p]}</option>
          ))}
        </Select>
      </Label>
      <Label text="Исполнитель">
        <Select value={ticket.assigneeId ?? ""} disabled={isPending} onChange={(e) => mutate({ assigneeId: e.target.value || null })}>
          <option value="">Не назначен</option>
          {employees.map((emp) => (
            <option key={emp.id} value={emp.id}>{emp.name}</option>
          ))}
        </Select>
      </Label>
    </div>
  );
}
