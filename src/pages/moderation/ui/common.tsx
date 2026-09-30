import { useState } from "react";
import { POST_STATUS, type ModerationPerson } from "@/entities/moderation";
import { useUrlFilters } from "@/shared/lib";
import { Button, ErrorNote, Modal, ModalActions, Pill, TextArea, ToggleChip } from "@/shared/ui";
import { QUICK_REASONS } from "../lib";

export function PersonLink({ person }: { person: ModerationPerson | null }) {
  const f = useUrlFilters();
  if (!person) return <span className="text-neutral-400">Удалённый пользователь</span>;
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        f.set({ user: String(person.id), page: f.get("page") });
      }}
      className="border-0 bg-transparent p-0 text-left text-[13px] font-medium text-brand hover:underline"
      title={`Карточка ${person.username}`}
    >
      {person.fullName || person.username}
    </button>
  );
}

export function OrgLink({ org }: { org: { id: number; name: string } }) {
  const f = useUrlFilters();
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        f.set({ org: String(org.id) });
      }}
      className="border-0 bg-transparent p-0 text-left text-[11px] text-neutral-500 hover:text-brand"
      title="Только эта организация"
    >
      {org.name}
    </button>
  );
}

export function StatusPill({ status }: { status: string }) {
  const s = POST_STATUS[status] ?? { label: status, tone: "neutral" as const };
  return (
    <Pill size="sm" tone={s.tone}>
      {s.label}
    </Pill>
  );
}

export function HideModal({ subject, onClose, onConfirm, pending, error }: { subject: string; onClose: () => void; onConfirm: (reason: string) => void; pending: boolean; error: Error | null }) {
  const [reason, setReason] = useState("");
  return (
    <Modal open onClose={onClose} width={520} title={`Скрыть ${subject}`}>
      <div className="text-[13px] leading-5 text-neutral-600">Пропадёт из ленты у всех. Автор не сможет вернуть, вы — сможете. Действие попадёт в журнал организации.</div>
      <div className="flex flex-wrap gap-1.5">
        {QUICK_REASONS.map((r) => (
          <ToggleChip key={r} on={reason === r} label={r} icon={reason === r ? "check" : "flag"} onClick={() => setReason(r)} />
        ))}
      </div>
      <TextArea look="plain" value={reason} maxLength={1000} onChange={(e) => setReason(e.target.value)} placeholder="Причина скрытия" />
      <ErrorNote error={error} />
      <ModalActions>
        <Button size="xl" onClick={onClose}>
          Отмена
        </Button>
        <Button size="xl" variant="danger" icon="eye-off" disabled={pending} onClick={() => onConfirm(reason.trim())}>
          Скрыть
        </Button>
      </ModalActions>
    </Modal>
  );
}
