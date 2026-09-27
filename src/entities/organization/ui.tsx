import { Pill } from "@/shared/ui";
import type { OrgStatus } from "./model";

export function OrgStatusPill({ status }: { status: OrgStatus }) {
  return <Pill tone={status === "Активна" ? "success" : "orange"}>{status}</Pill>;
}
