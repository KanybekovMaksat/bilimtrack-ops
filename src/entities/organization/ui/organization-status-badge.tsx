import { Badge, type Tone } from "@/shared/ui";
import type { OrganizationStatus } from "../model/types";

const config: Record<OrganizationStatus, { label: string; tone: Tone }> = {
  active: { label: "Активна", tone: "success" },
  trial: { label: "Пробный период", tone: "brand" },
  churned: { label: "Отключена", tone: "neutral" },
};

export function OrganizationStatusBadge({ status }: { status: OrganizationStatus }) {
  const { label, tone } = config[status];
  return <Badge tone={tone}>{label}</Badge>;
}
