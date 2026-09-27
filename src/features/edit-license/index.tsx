import { useState } from "react";
import { useLicenseCatalog, useUpdateLicense } from "@/entities/license";
import { useSetOrgModules } from "@/entities/organization";
import { toggleIn } from "@/shared/lib";
import { Button, Callout, CheckBox, ErrorNote, Field, Modal, ModalActions, TextArea, TextInput, ToggleChip } from "@/shared/ui";

type Current = {
  plan: string | null;
  licensedModules: string[] | null;
  enabledModules: string[];
  validFrom: string | null;
  validUntil: string | null;
  note: string;
};

type Props = { organization: { id: number; name: string }; current: Current; onClose: () => void };

/** Records what the contract says: plan, licensed modules, period. Enabled modules stay as they are. */
export function EditLicenseModal({ organization, current, onClose }: Props) {
  const catalog = useLicenseCatalog();
  const update = useUpdateLicense(organization.id);
  const applyModules = useSetOrgModules(organization.id);
  const [syncModules, setSyncModules] = useState(false);
  const [plan, setPlan] = useState(current.plan ?? "custom");
  const [modules, setModules] = useState<string[]>(current.licensedModules ?? current.enabledModules);
  const [validFrom, setValidFrom] = useState(current.validFrom ?? "");
  const [validUntil, setValidUntil] = useState(current.validUntil ?? "");
  const [note, setNote] = useState(current.note);

  const choosePlan = (code: string) => {
    setPlan(code);
    const defaults = catalog.plans.find((p) => p.code === code)?.modules ?? [];
    if (defaults.length) setModules(defaults);
  };

  const unlicensedOn = current.enabledModules.filter((c) => !modules.includes(c));
  const licensedOff = modules.filter((c) => !current.enabledModules.includes(c));
  const nameOf = (code: string) => catalog.modules.find((m) => m.code === code)?.name ?? code;
  const badDates = !!validFrom && !!validUntil && validUntil < validFrom;

  const save = () =>
    update.mutate(
      { plan, licensedModules: modules, validFrom: validFrom || null, validUntil: validUntil || null, note },
      {
        onSuccess: () => {
          if (!syncModules) return onClose();
          // Bring enabled modules in line with the contract in the same step.
          const all = catalog.modules.map((m) => m.code);
          applyModules.mutate(Object.fromEntries(all.map((c) => [c, modules.includes(c)])), { onSuccess: onClose });
        },
      },
    );

  return (
    <Modal open onClose={onClose} width={640} title={`Лицензия · ${organization.name}`}>
      <Field label="Пакет" strong>
        <div className="flex flex-wrap gap-1.5">
          {catalog.plans.map((p) => (
            <Button key={p.code} size="sm" variant={p.code === plan ? "primary" : "outline"} onClick={() => choosePlan(p.code)} title={p.description}>
              {p.label}
            </Button>
          ))}
        </div>
      </Field>
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold text-neutral-500">Модули по договору · {modules.length}</span>
        <div className="flex flex-wrap gap-1.5">
          {catalog.modules.map((m) => (
            <span key={m.code} title={m.description}>
              <ToggleChip on={modules.includes(m.code)} label={m.name} onClick={() => setModules((list) => toggleIn(list, m.code))} />
            </span>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Действует с" strong>
          <TextInput look="plain" type="date" value={validFrom} onChange={(e) => setValidFrom(e.target.value)} />
        </Field>
        <Field label="Действует до" strong>
          <TextInput look="plain" type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
        </Field>
      </div>
      <Field label="Заметка" strong>
        <TextArea look="plain" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Номер договора, особые условия, контакт" />
      </Field>
      {(unlicensedOn.length > 0 || licensedOff.length > 0) && (
        <Callout tone="muted" icon="info-circle" className="text-xs leading-[18px]">
          Лицензия не включает и не выключает модули.
          {unlicensedOn.length > 0 && <> Включены вне договора: {unlicensedOn.map(nameOf).join(", ")}.</>}
          {licensedOff.length > 0 && <> В договоре, но выключены: {licensedOff.map(nameOf).join(", ")}.</>}
        </Callout>
      )}
      {(unlicensedOn.length > 0 || licensedOff.length > 0) && (
        <button type="button" onClick={() => setSyncModules((v) => !v)} className="flex items-center gap-2.5 border-0 bg-transparent p-0 text-left text-[13px]">
          <CheckBox on={syncModules} />
          Сразу включить модули строго по договору ({modules.length})
        </button>
      )}
      {badDates && <div className="text-xs text-warn">Дата окончания раньше даты начала.</div>}
      <ErrorNote error={update.error ?? applyModules.error} />
      <ModalActions>
        <Button size="xl" onClick={onClose}>
          Отмена
        </Button>
        <Button size="xl" variant="primary" disabled={update.isPending || applyModules.isPending || badDates} onClick={save}>
          {update.isPending || applyModules.isPending ? "Сохраняем…" : "Сохранить лицензию"}
        </Button>
      </ModalActions>
    </Modal>
  );
}
