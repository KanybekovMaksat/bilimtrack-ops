import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { api, apiPage, QK } from "@/shared/api";

/* Platform-wide journals. Backend: server/apps/ops (use_cases/journal.py) over audit.AuditLog / audit.AccessLog:
   /api/v1/ops/audit/, /ops/audit/choices/, /ops/access-logs/. */

export const JOURNAL_PAGE = 50;

export type AuditEntry = {
  id: number;
  createdAt: string;
  organization: { id: number; name: string } | null;
  actor: { id: number | null; fullName: string; role: string };
  actorIp: string | null;
  action: string;
  actionLabel: string;
  section: string;
  sectionLabel: string;
  objectRepr: string;
  details: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
};

export type AccessEntry = {
  id: number;
  createdAt: string;
  organization: { id: number; name: string } | null;
  userId: number | null;
  username: string;
  actorName: string;
  eventType: "login_success" | "login_failed" | "logout" | "password_changed";
  eventTypeLabel: string;
  failureReason: string;
  ipAddress: string | null;
  browser: string;
  os: string;
  deviceType: string;
  country: string;
  city: string;
};

type Choice = { value: string; label: string };
export type JournalChoices = { sections: Choice[]; actions: Choice[]; eventTypes: Choice[] };

export type AuditFilters = {
  q?: string;
  section?: string;
  action?: string;
  organizationId?: string;
  operatorsOnly?: boolean;
  dateFrom?: string;
  dateTo?: string;
};

export type AccessFilters = {
  q?: string;
  eventType?: string;
  failedOnly?: boolean;
  operatorsOnly?: boolean;
  organizationId?: string;
  dateFrom?: string;
  dateTo?: string;
};

const flags = (f: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(f).map(([k, v]) => [k, typeof v === "boolean" ? (v ? "true" : undefined) : (v as string | undefined)]));

export const useAudit = (filters: AuditFilters, page: number) =>
  useQuery({
    queryKey: [QK.audit, filters, page],
    queryFn: () => apiPage<AuditEntry>("ops/audit/", { ...flags(filters), page, page_size: JOURNAL_PAGE }),
    placeholderData: keepPreviousData,
  });

export const useAccessLogs = (filters: AccessFilters, page: number) =>
  useQuery({
    queryKey: [QK.accessLogs, filters, page],
    queryFn: () => apiPage<AccessEntry>("ops/access-logs/", { ...flags(filters), page, page_size: JOURNAL_PAGE }),
    placeholderData: keepPreviousData,
    refetchInterval: 60_000,
  });

export const useJournalChoices = () =>
  useQuery({ queryKey: [QK.auditChoices], queryFn: () => api<JournalChoices>("ops/audit/choices/"), staleTime: 30 * 60_000 });

/** Keys of before/after as rows «поле · было · стало». */
export function diffRows(entry: Pick<AuditEntry, "before" | "after">) {
  const keys = [...new Set([...Object.keys(entry.before ?? {}), ...Object.keys(entry.after ?? {})])];
  const show = (v: unknown) => (v === null || v === undefined || v === "" ? "—" : typeof v === "object" ? JSON.stringify(v) : String(v));
  return keys.map((k) => ({ field: k, was: show(entry.before?.[k]), now: show(entry.after?.[k]) }));
}
