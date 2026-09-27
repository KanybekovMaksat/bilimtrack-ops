import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { api, apiList } from "@/shared/api";

/* Contract licenses vs. modules actually enabled for each organization.
   Backend: server/apps/ops (OrganizationLicense, use_cases/licenses.py), /api/v1/ops/licenses/. */

export type ModuleInfo = { code: string; name: string; description: string };

export type LicensePlan = {
  code: string;
  label: string;
  description: string;
  /** Default module set the plan brings when chosen. */
  modules: string[];
  organizationsCount: number;
};

export type LicenseCatalog = { modules: ModuleInfo[]; plans: LicensePlan[] };

export type Mismatch = { code: string; kind: "not_enabled" | "unlicensed" };

/** LicenseRowSerializer. */
export type LicenseRow = {
  organization: { id: number; name: string; shortName: string; slug: string; type: string; typeLabel: string; status: string };
  plan: string | null;
  planLabel: string | null;
  /** null — the contract has not been recorded in Ops yet. */
  licensedModules: string[] | null;
  enabledModules: string[];
  validFrom: string | null;
  validUntil: string | null;
  note: string;
  updatedAt: string | null;
  mismatches: Mismatch[];
};

export type LicenseInput = {
  plan?: string;
  licensedModules?: string[];
  validFrom?: string | null;
  validUntil?: string | null;
  note?: string;
};

/** y = on per contract, n = not in contract, p = in contract but off, x = on without contract, u = no contract recorded. */
export type LicenseCell = "y" | "n" | "p" | "x" | "u" | "o";

export const LICENSE_CELL: Record<LicenseCell, { icon: string; color: string; bg: string; label: string }> = {
  y: { icon: "circle-check-filled", color: "#00a63e", bg: "transparent", label: "Включено по договору" },
  p: { icon: "circle-dashed", color: "#155dfc", bg: "#eff6ff", label: "В договоре, не включено" },
  x: { icon: "alert-triangle", color: "#c2410c", bg: "#fffbeb", label: "Включено вне договора" },
  n: { icon: "minus", color: "#d4d4d4", bg: "transparent", label: "Нет в договоре" },
  o: { icon: "circle-check", color: "#737373", bg: "transparent", label: "Включено, договор не заведён" },
  u: { icon: "minus", color: "#e5e5e5", bg: "transparent", label: "Выключено, договор не заведён" },
};

export function licenseCell(row: LicenseRow, code: string): LicenseCell {
  const on = row.enabledModules.includes(code);
  if (row.licensedModules === null) return on ? "o" : "u";
  const licensed = row.licensedModules.includes(code);
  if (licensed) return on ? "y" : "p";
  return on ? "x" : "n";
}

export const licenseKeys = { rows: ["licenses"] as const, catalog: ["licenses", "catalog"] as const };

export const useLicenseCatalog = () =>
  useSuspenseQuery({ queryKey: licenseKeys.catalog, queryFn: () => api<LicenseCatalog>("ops/licenses/catalog/"), staleTime: 5 * 60_000 }).data;

export const useLicenses = () =>
  useSuspenseQuery({ queryKey: licenseKeys.rows, queryFn: () => apiList<LicenseRow>("ops/licenses/") }).data;

/** PUT ops/organizations/:id/license/ — records the contract; never toggles modules. */
export function useUpdateLicense(organizationId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: LicenseInput) => api<LicenseRow>(`ops/organizations/${organizationId}/license/`, { method: "PUT", body: input }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: licenseKeys.rows });
      qc.invalidateQueries({ queryKey: ["orgs"] });
    },
  });
}
