import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, apiBlob, apiUpload } from "@/shared/api";
import type { PillTone } from "@/shared/ui";

/* Contracts Bilimtrack signed with an organization, with attached scans.
   Backend: server/apps/ops (OrganizationContract, use_cases/contracts.py),
   /api/v1/ops/organizations/:id/contracts/. Files are downloaded through the API only. */

export type ContractStatus = "draft" | "active" | "expired" | "terminated";

export const CONTRACT_STATUS: Record<ContractStatus, { label: string; tone: PillTone }> = {
  draft: { label: "Готовится", tone: "neutral" },
  active: { label: "Действует", tone: "success" },
  expired: { label: "Истёк", tone: "orange" },
  terminated: { label: "Расторгнут", tone: "danger" },
};

type Person = { id: number; username: string; fullName: string };

export type ContractFile = { id: number; name: string; size: number; contentType: string; uploadedBy: Person | null; createdAt: string };

export type Contract = {
  id: number;
  organizationId: number;
  number: string;
  title: string;
  status: ContractStatus;
  statusLabel: string;
  signedAt: string | null;
  validFrom: string | null;
  validUntil: string | null;
  amount: string | null;
  currency: string;
  note: string;
  createdBy: Person | null;
  files: ContractFile[];
  createdAt: string;
  updatedAt: string;
};

export type ContractInput = Partial<{
  number: string;
  title: string;
  status: ContractStatus;
  signedAt: string | null;
  validFrom: string | null;
  validUntil: string | null;
  amount: string | null;
  currency: string;
  note: string;
}>;

const base = (orgId: number) => `ops/organizations/${orgId}/contracts`;
export const contractKeys = { list: (orgId: number) => ["orgs", orgId, "contracts"] as const };

export const useContracts = (orgId: number) => useQuery({ queryKey: contractKeys.list(orgId), queryFn: () => api<Contract[]>(`${base(orgId)}/`) });

function useInvalidate(orgId: number) {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: contractKeys.list(orgId) });
}

export function useSaveContract(orgId: number) {
  const invalidate = useInvalidate(orgId);
  return useMutation({
    mutationFn: ({ id, ...input }: ContractInput & { id?: number }) =>
      id ? api<Contract>(`${base(orgId)}/${id}/`, { method: "PATCH", body: input }) : api<Contract>(`${base(orgId)}/`, { method: "POST", body: input }),
    onSuccess: invalidate,
  });
}

export function useDeleteContract(orgId: number) {
  const invalidate = useInvalidate(orgId);
  return useMutation({ mutationFn: (id: number) => api(`${base(orgId)}/${id}/`, { method: "DELETE" }), onSuccess: invalidate });
}

export function useUploadContractFile(orgId: number) {
  const invalidate = useInvalidate(orgId);
  return useMutation({
    mutationFn: ({ contractId, file }: { contractId: number; file: File }) => apiUpload<ContractFile>(`${base(orgId)}/${contractId}/files/`, file),
    onSuccess: invalidate,
  });
}

export function useDeleteContractFile(orgId: number) {
  const invalidate = useInvalidate(orgId);
  return useMutation({
    mutationFn: ({ contractId, fileId }: { contractId: number; fileId: number }) => api(`${base(orgId)}/${contractId}/files/${fileId}/`, { method: "DELETE" }),
    onSuccess: invalidate,
  });
}

/** Download (or open in a new tab for PDF / images) through the authorized API. */
export async function openContractFile(orgId: number, contractId: number, file: ContractFile, inline = false) {
  const { blob } = await apiBlob(`${base(orgId)}/${contractId}/files/${file.id}/`, inline ? { inline: "1" } : {});
  const url = URL.createObjectURL(blob);
  if (inline) window.open(url, "_blank", "noopener");
  else {
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    a.click();
  }
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export const fileSize = (bytes: number) =>
  bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} МБ` : `${Math.max(1, Math.round(bytes / 1024))} КБ`;

export const fileIcon = (f: Pick<ContractFile, "name" | "contentType">) =>
  f.contentType.startsWith("image/") ? "photo" : /\.(zip|rar|7z)$/i.test(f.name) ? "archive" : "file-text";

export const canPreview = (f: Pick<ContractFile, "contentType">) => f.contentType === "application/pdf" || f.contentType.startsWith("image/");

export const CONTRACT_ACCEPT = ".pdf,.doc,.docx,.xls,.xlsx,.odt,.rtf,.txt,.jpg,.jpeg,.png,.webp,.heic,.zip,.rar,.7z";
