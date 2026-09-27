import { useQuery } from "@tanstack/react-query";
import type { TicketFilters } from "../model/types";
import { ticketApi } from "./ticket-api";

export const ticketKeys = {
  all: ["tickets"] as const,
  list: (filters: TicketFilters) => ["tickets", "list", filters] as const,
  detail: (id: string) => ["tickets", "detail", id] as const,
};

export const useTickets = (filters: TicketFilters = {}) =>
  useQuery({ queryKey: ticketKeys.list(filters), queryFn: () => ticketApi.list(filters) });

export const useTicket = (id: string) =>
  useQuery({ queryKey: ticketKeys.detail(id), queryFn: () => ticketApi.get(id) });
