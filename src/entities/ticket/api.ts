import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { api, apiList } from "@/shared/api";
import { toTicket, type ApiTicket } from "./model";

export const ticketKeys = {
  all: ["tickets"] as const,
  detail: (id: number) => ["tickets", id] as const,
};

const fetchTickets = async () => (await apiList<ApiTicket>("support-tickets/")).map((t) => toTicket(t));

/** Newest first. For the helpdesk account this is every ticket across organizations. */
export const useTickets = () =>
  useSuspenseQuery({ queryKey: ticketKeys.all, queryFn: fetchTickets, refetchInterval: 60_000 }).data;

/** Non-suspending variant for counters in the shell. */
export const useTicketsSoft = () => useQuery({ queryKey: ticketKeys.all, queryFn: fetchTickets, refetchInterval: 60_000 });

export const useTicket = (id: number) =>
  useSuspenseQuery({
    queryKey: ticketKeys.detail(id),
    queryFn: async () => toTicket(await api<ApiTicket>(`support-tickets/${id}/`)),
  }).data;

function useInvalidate(id: number) {
  const qc = useQueryClient();
  return () => Promise.all([qc.invalidateQueries({ queryKey: ticketKeys.detail(id) }), qc.invalidateQueries({ queryKey: ticketKeys.all, exact: true })]);
}

/** POST messages/ — a reply from support also moves an open ticket to "in progress" and assigns it. */
export function useReplyToTicket(id: number) {
  const invalidate = useInvalidate(id);
  return useMutation({
    mutationFn: (text: string) => api(`support-tickets/${id}/messages/`, { method: "POST", body: { text } }),
    onSuccess: invalidate,
  });
}

/** POST close/ — the only status transition the backend exposes. */
export function useCloseTicket(id: number) {
  const invalidate = useInvalidate(id);
  return useMutation({
    mutationFn: () => api(`support-tickets/${id}/close/`, { method: "POST", body: {} }),
    onSuccess: invalidate,
  });
}
