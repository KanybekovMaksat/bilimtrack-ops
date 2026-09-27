import { Pill } from "@/shared/ui";
import { orgStatusLabel, type OrgStatus } from "./model";

export function OrgStatusPill({ status }: { status: OrgStatus }) {
  return <Pill tone={status === "active" ? "success" : status === "inactive" ? "orange" : "neutral"}>{orgStatusLabel[status] ?? status}</Pill>;
}
