import { Pill } from "@/shared/ui";
import { orgCategoryLabel, orgStatusLabel, type OrgCategory, type OrgStatus } from "./model";

export function OrgStatusPill({ status }: { status: OrgStatus }) {
  return <Pill tone={status === "active" ? "success" : status === "inactive" ? "orange" : "neutral"}>{orgStatusLabel[status] ?? status}</Pill>;
}

/** Only `beta` is marked; regular clients need no badge. */
export function OrgCategoryPill({ category }: { category?: OrgCategory }) {
  if (category !== "beta") return null;
  return (
    <Pill size="sm" tone="purple" icon="flask">
      {orgCategoryLabel.beta}
    </Pill>
  );
}
