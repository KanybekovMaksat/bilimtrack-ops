import { create } from "zustand";
import { useMockQuery } from "@/shared/api";
import { DEV_TASKS, INITIAL_ESCALATIONS, TICKETS, detailFor } from "./model";

export const ticketKeys = {
  list: ["tickets"] as const,
  detail: (id: string) => ["tickets", id] as const,
};

export const useTickets = () => useMockQuery(ticketKeys.list, () => TICKETS);

export const useTicket = (id: string) =>
  useMockQuery(ticketKeys.detail(id), () => {
    const ticket = TICKETS.find((t) => t.id === id);
    return ticket ? { ticket, detail: detailFor(ticket) } : null;
  });

type EscalationState = {
  /** ticket id → dev backlog task key */
  byTicket: Record<string, string>;
  escalate: (ticketId: string, subject: string) => string;
};

let nextDevNumber = 418;

export const useEscalations = create<EscalationState>()((set) => ({
  byTicket: INITIAL_ESCALATIONS,
  escalate: (ticketId, subject) => {
    const key = `DEV-${nextDevNumber++}`;
    DEV_TASKS[key] = { title: subject, status: "Новая" };
    set((s) => ({ byTicket: { ...s.byTicket, [ticketId]: key } }));
    return key;
  },
}));

export const devTask = (key: string) => DEV_TASKS[key];
