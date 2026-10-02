import { Pill } from "@/shared/ui";
import { STATE_LABEL, type ForumPublicationState } from "./model";

export function ForumStatePill({ state }: { state: ForumPublicationState }) {
  const s = STATE_LABEL[state] ?? { label: state, tone: "neutral" as const };
  return (
    <Pill size="sm" tone={s.tone}>
      {s.label}
    </Pill>
  );
}
