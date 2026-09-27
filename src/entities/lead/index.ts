import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { api, apiList } from "@/shared/api";
import type { PillTone } from "@/shared/ui";

/* Demo requests from the landing pages and the blog.
   Backend: server/apps/leads (DemoRequest), staff API /api/v1/cms/demo-requests/ (list + PATCH status / note). */

export type LeadStatus = "new" | "contacted" | "demo_scheduled" | "closed";

export const LEAD_STATUSES: LeadStatus[] = ["new", "contacted", "demo_scheduled", "closed"];

export const leadStatusLabel: Record<LeadStatus, string> = {
  new: "Новая",
  contacted: "На связи",
  demo_scheduled: "Демо назначено",
  closed: "Закрыта",
};

export const leadStatusTone: Record<LeadStatus, PillTone> = {
  new: "solidBrand",
  contacted: "info",
  demo_scheduled: "orange",
  closed: "neutral",
};

/** Raw CMSDemoRequestSerializer. Two forms feed it: the SIS landing sends
 *  `organizationName` + `studentCountRange`, the blog / main landing — `organization` + `orgType` + `studentsCount`. */
type ApiLead = {
  id: number;
  name: string;
  contact: string;
  organization: string;
  organizationName: string;
  orgType: string;
  orgTypeLabel: string;
  studentsCount: string;
  studentsCountLabel: string;
  studentCountRange: string;
  source: string;
  sourceArticle: number | null;
  sourceArticleTitle: string | null;
  status: LeadStatus;
  note: string;
  createdAt: string;
  updatedAt: string;
};

export type Lead = {
  id: number;
  createdAt: string;
  updatedAt: string;
  name: string;
  contact: string;
  org: string;
  type: string;
  size: string;
  source: string;
  /** Title of the blog article the request came from, if any. */
  article: string | null;
  status: LeadStatus;
  /** Manager's note: who was called, what was agreed. */
  note: string;
};

const toLead = (l: ApiLead): Lead => ({
  id: l.id,
  createdAt: l.createdAt,
  updatedAt: l.updatedAt,
  name: l.name,
  contact: l.contact,
  org: l.organization || l.organizationName || "—",
  type: l.orgTypeLabel || "—",
  size: l.studentsCountLabel || l.studentCountRange || "—",
  source: l.sourceArticleTitle ? `Статья «${l.sourceArticleTitle}»` : l.source || (l.organizationName ? "Лендинг SIS" : "Лендинг"),
  article: l.sourceArticleTitle,
  status: l.status,
  note: l.note ?? "",
});

const leadKeys = { all: ["leads"] as const };
const fetchLeads = async () => (await apiList<ApiLead>("cms/demo-requests/")).map(toLead);

export const useLeads = () => useSuspenseQuery({ queryKey: leadKeys.all, queryFn: fetchLeads }).data;

/** Non-suspending variant for counters in the shell. */
export const useLeadsSoft = () => useQuery({ queryKey: leadKeys.all, queryFn: fetchLeads });

type LeadPatch = { id: number; status?: LeadStatus; note?: string };

/** PATCH cms/demo-requests/:id/ — status and/or the manager's note. */
export function useUpdateLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...patch }: LeadPatch) => api<ApiLead>(`cms/demo-requests/${id}/`, { method: "PATCH", body: patch }),
    // Optimistic: the row changes at once, rolls back if the server refuses.
    onMutate: async ({ id, ...patch }) => {
      await qc.cancelQueries({ queryKey: leadKeys.all });
      const prev = qc.getQueryData<Lead[]>(leadKeys.all);
      qc.setQueryData<Lead[]>(leadKeys.all, (ls) => ls?.map((l) => (l.id === id ? { ...l, ...patch } : l)));
      return { prev };
    },
    onError: (_e, _v, ctx) => ctx?.prev && qc.setQueryData(leadKeys.all, ctx.prev),
    onSettled: () => qc.invalidateQueries({ queryKey: leadKeys.all }),
  });
}
