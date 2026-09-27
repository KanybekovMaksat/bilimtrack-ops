import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { api, apiList } from "@/shared/api";
import type { PillTone } from "@/shared/ui";

/* Demo requests from the landing page and the blog.
   Backend: server/apps/leads (DemoRequest), staff API /api/v1/cms/demo-requests/ (list + PATCH status). */

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

const ORG_TYPE: Record<string, string> = { school: "Школа", college: "Колледж", university: "Университет", other: "Другое" };
const STUDENTS: Record<string, string> = { lt100: "до 100", "100_300": "100–300", "300_1000": "300–1000", gt1000: "свыше 1000" };

/** Raw CMSDemoRequestSerializer. */
type ApiLead = {
  id: number;
  name: string;
  contact: string;
  organization: string;
  orgType: string;
  studentsCount: string;
  source: string;
  sourceArticle: number | null;
  sourceArticleTitle: string | null;
  status: LeadStatus;
  createdAt: string;
};

export type Lead = {
  id: number;
  createdAt: string;
  name: string;
  contact: string;
  org: string;
  type: string;
  size: string;
  source: string;
  /** Title of the blog article the request came from, if any. */
  article: string | null;
  status: LeadStatus;
};

const toLead = (l: ApiLead): Lead => ({
  id: l.id,
  createdAt: l.createdAt,
  name: l.name,
  contact: l.contact,
  org: l.organization || "—",
  type: ORG_TYPE[l.orgType] ?? (l.orgType || "—"),
  size: STUDENTS[l.studentsCount] ?? (l.studentsCount || "—"),
  source: l.sourceArticleTitle ? `Статья «${l.sourceArticleTitle}»` : l.source || "Лендинг",
  article: l.sourceArticleTitle,
  status: l.status,
});

const leadKeys = { all: ["leads"] as const };
const fetchLeads = async () => (await apiList<ApiLead>("cms/demo-requests/")).map(toLead);

export const useLeads = () => useSuspenseQuery({ queryKey: leadKeys.all, queryFn: fetchLeads }).data;

/** Non-suspending variant for counters in the shell. */
export const useLeadsSoft = () => useQuery({ queryKey: leadKeys.all, queryFn: fetchLeads });

export function useUpdateLeadStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: LeadStatus }) =>
      api<ApiLead>(`cms/demo-requests/${id}/`, { method: "PATCH", body: { status } }),
    // Optimistic: the pill changes at once, rolls back if the server refuses.
    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey: leadKeys.all });
      const prev = qc.getQueryData<Lead[]>(leadKeys.all);
      qc.setQueryData<Lead[]>(leadKeys.all, (ls) => ls?.map((l) => (l.id === id ? { ...l, status } : l)));
      return { prev };
    },
    onError: (_e, _v, ctx) => ctx?.prev && qc.setQueryData(leadKeys.all, ctx.prev),
    onSettled: () => qc.invalidateQueries({ queryKey: leadKeys.all }),
  });
}
