import { keepPreviousData, useMutation, useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { api, apiAll, apiPage, QK, type Page } from "@/shared/api";
import {
  TICKETS_PAGE_SIZE,
  ticketQuery,
  toTicket,
  toTicketDetail,
  type ApiTicket,
  type ApiTicketDetail,
  type ReplyTemplate,
  type ReplyTemplateInput,
  type Ticket,
  type TicketCategory,
  type TicketFilters,
  type TicketPriority,
  type TicketStatus,
  type TicketSummary,
} from "./model";

export const ticketKeys = {
  all: [QK.tickets] as const,
  lists: [QK.tickets, "list"] as const,
  list: (f: TicketFilters) => [QK.tickets, "list", f] as const,
  summaries: [QK.tickets, "summary"] as const,
  summary: (f: TicketFilters) => [QK.tickets, "summary", f] as const,
  detail: (id: number) => [QK.tickets, "detail", id] as const,
  templates: (all: boolean) => [QK.ticketTemplates, all] as const,
};

/**
 * How often the queue and an open ticket ask the server for news. The list and the thread pause while the tab
 * is hidden and catch up the moment it is shown again; the counters keep going, because they drive the
 * «(3)» in the browser tab — the one thing an operator sees from another tab.
 */
const QUEUE_POLL = 15_000;
const THREAD_POLL = 5_000;
const LIVE = { refetchOnWindowFocus: "always" } as const;

const mapPage = (page: Page<ApiTicket>): Page<Ticket> => ({ rows: page.rows.map((t) => toTicket(t)), count: page.count });

/** GET ops/tickets/ — one page of the queue; filtering, sorting and paging are done by the server. */
export const useTicketList = (f: TicketFilters, { enabled = true }: { enabled?: boolean } = {}) =>
  useQuery({
    queryKey: ticketKeys.list(f),
    queryFn: async () => mapPage(await apiPage<ApiTicket>("ops/tickets/", { ...ticketQuery(f), page: f.page ?? 1, page_size: f.pageSize ?? TICKETS_PAGE_SIZE })),
    placeholderData: keepPreviousData,
    refetchInterval: QUEUE_POLL,
    ...LIVE,
    enabled,
  });

/** Every ticket of the selection (no paging) for the CSV export. */
export const exportTickets = async (f: TicketFilters) => mapPage(await apiAll<ApiTicket>("ops/tickets/", ticketQuery(f)));

/**
 * GET ops/tickets/summary/ — tab counters, unread and the SLA strip under the same filters.
 * `enabled: false` without the `support` privilege (no 403 noise in the shell).
 */
export const useTicketSummary = (f: TicketFilters = {}, { enabled = true }: { enabled?: boolean } = {}) =>
  useQuery({
    queryKey: ticketKeys.summary(f),
    queryFn: () => api<TicketSummary>("ops/tickets/summary/", { query: ticketQuery(f) }),
    placeholderData: keepPreviousData,
    refetchInterval: QUEUE_POLL,
    refetchIntervalInBackground: true,
    ...LIVE,
    enabled,
  });

/** GET ops/tickets/:id/ — the thread with team notes and history; polled, so a new message shows up by itself. */
export const useTicket = (id: number) =>
  useSuspenseQuery({
    queryKey: ticketKeys.detail(id),
    queryFn: async () => toTicketDetail(await api<ApiTicketDetail>(`ops/tickets/${id}/`)),
    refetchInterval: THREAD_POLL,
    ...LIVE,
  }).data;

function useRefreshTicket(id: number) {
  const qc = useQueryClient();
  return () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: ticketKeys.detail(id) }),
      qc.invalidateQueries({ queryKey: ticketKeys.lists }),
      qc.invalidateQueries({ queryKey: ticketKeys.summaries }),
    ]);
}

export type TicketReply = { text: string; attachment?: File | null; internal?: boolean; templateId?: number | null };

/**
 * POST messages/ — a reply to the requester (takes an open ticket in work and assigns it to the replier)
 * or, with `internal`, a note only the team sees.
 */
export function useReplyToTicket(id: number) {
  const refresh = useRefreshTicket(id);
  return useMutation({
    mutationFn: ({ text, attachment, internal = false, templateId }: TicketReply) => {
      if (!attachment) return api(`ops/tickets/${id}/messages/`, { method: "POST", body: { text, isInternal: internal, templateId: templateId ?? null } });
      const form = new FormData();
      form.append("text", text);
      form.append("attachment", attachment);
      form.append("isInternal", String(internal));
      if (templateId) form.append("templateId", String(templateId));
      return api(`ops/tickets/${id}/messages/`, { method: "POST", body: form });
    },
    onSuccess: refresh,
  });
}

export type TicketUpdate = { status?: TicketStatus; priority?: TicketPriority; category?: TicketCategory; assigneeId?: number | null };

/** PATCH ops/tickets/:id/ — status, priority, category, assignee; each change lands in the ticket history. */
export function useUpdateTicket(id: number) {
  const qc = useQueryClient();
  const refresh = useRefreshTicket(id);
  return useMutation({
    mutationFn: (patch: TicketUpdate) => api<ApiTicketDetail>(`ops/tickets/${id}/`, { method: "PATCH", body: patch }),
    onSuccess: (fresh) => {
      qc.setQueryData(ticketKeys.detail(id), toTicketDetail(fresh));
      return refresh();
    },
  });
}

/** POST read/ — the team has seen the thread (one shared mark); `unread: true` puts the ticket back. */
export function useMarkTicketRead(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (unread: boolean = false) => api(`ops/tickets/${id}/read/`, { method: "POST", body: { isUnread: unread } }),
    onSuccess: () =>
      Promise.all([
        qc.invalidateQueries({ queryKey: ticketKeys.detail(id) }),
        qc.invalidateQueries({ queryKey: ticketKeys.lists }),
        qc.invalidateQueries({ queryKey: ticketKeys.summaries }),
      ]),
  });
}

/** GET ops/ticket-templates/ — canned replies of the team; `all` includes switched-off ones (for the editor). */
export const useReplyTemplates = ({ all = false }: { all?: boolean } = {}) =>
  useQuery({
    queryKey: ticketKeys.templates(all),
    queryFn: () => api<ReplyTemplate[]>("ops/ticket-templates/", { query: { includeInactive: all ? "true" : undefined } }),
    staleTime: 5 * 60_000,
  });

/** POST / PATCH ops/ticket-templates/ — `id` decides which. */
export function useSaveReplyTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: ReplyTemplateInput & { id?: number }) =>
      id ? api<ReplyTemplate>(`ops/ticket-templates/${id}/`, { method: "PATCH", body }) : api<ReplyTemplate>("ops/ticket-templates/", { method: "POST", body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QK.ticketTemplates] }),
  });
}

export function useDeleteReplyTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api(`ops/ticket-templates/${id}/`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QK.ticketTemplates] }),
  });
}
