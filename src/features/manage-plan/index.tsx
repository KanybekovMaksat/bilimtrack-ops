import { useState } from "react";
import { useCreatePlan, useUpdatePlan, type Plan, type PlanInput } from "@/entities/plan";
import { Button, Callout, ErrorNote, Field, Modal, ModalActions, TextArea, TextInput, Toggle } from "@/shared/ui";

type Form = { code: string; name: string; description: string; price: string; durationDays: string; sortOrder: string; isActive: boolean; isGroup: boolean; minSeats: string };

const EMPTY: Form = { code: "", name: "", description: "", price: "", durationDays: "30", sortOrder: "0", isActive: true, isGroup: false, minSeats: "1" };

const toForm = (p: Plan): Form => ({
  code: p.code,
  name: p.name,
  description: p.description,
  price: String(p.price),
  durationDays: String(p.durationDays),
  sortOrder: String(p.sortOrder),
  isActive: p.isActive,
  isGroup: p.isGroup,
  minSeats: String(p.minSeats),
});

function toInput(f: Form): PlanInput | null {
  const price = Number(f.price.replace(",", "."));
  const durationDays = Number(f.durationDays);
  const sortOrder = Number(f.sortOrder || 0);
  const minSeats = Number(f.minSeats || 1);
  const ok =
    /^[a-z0-9-]+$/.test(f.code) &&
    f.name.trim() &&
    price > 0 &&
    Number.isInteger(durationDays) &&
    durationDays >= 1 &&
    Number.isInteger(minSeats) &&
    minSeats >= 1;
  if (!ok) return null;
  return { code: f.code, name: f.name.trim(), description: f.description.trim(), price, durationDays, sortOrder, isActive: f.isActive, isGroup: f.isGroup, minSeats: f.isGroup ? minSeats : 1 };
}

/** Create (no `plan`) or edit a Bilimtrack+ plan. Price changes affect only new invoices. */
export function PlanFormModal({ plan, onClose }: { plan?: Plan; onClose: () => void }) {
  const [form, setForm] = useState<Form>(plan ? toForm(plan) : EMPTY);
  const create = useCreatePlan();
  const update = useUpdatePlan(plan?.id ?? 0);
  const mutation = plan ? update : create;
  const input = toInput(form);
  const set = (patch: Partial<Form>) => setForm((f) => ({ ...f, ...patch }));
  const digits = (v: string) => v.replace(/[^\d]/g, "");

  const save = () => {
    if (!input) return;
    if (plan) update.mutate(input, { onSuccess: onClose });
    else create.mutate(input, { onSuccess: onClose });
  };

  return (
    <Modal open onClose={onClose} width={560} title={plan ? `Тариф «${plan.name}»` : "Новый тариф Bilimtrack+"}>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Название" strong>
          <TextInput inputSize="md" value={form.name} onChange={(e) => set({ name: e.target.value })} placeholder="1 год" />
        </Field>
        <Field label="Код (латиница, цифры, дефис)">
          <TextInput inputSize="md" numeric value={form.code} onChange={(e) => set({ code: e.target.value.toLowerCase() })} placeholder="year" />
        </Field>
        <Field label={form.isGroup ? "Цена за человека, KGS" : "Цена, KGS"}>
          <TextInput inputSize="md" numeric value={form.price} onChange={(e) => set({ price: e.target.value.replace(/[^\d.,]/g, "") })} />
        </Field>
        <Field label="Срок, дней">
          <TextInput inputSize="md" numeric value={form.durationDays} onChange={(e) => set({ durationDays: digits(e.target.value) })} />
        </Field>
        <Field label="Порядок на витрине">
          <TextInput inputSize="md" numeric value={form.sortOrder} onChange={(e) => set({ sortOrder: digits(e.target.value) })} />
        </Field>
        <Field label="Продаётся">
          <div className="flex h-9 items-center">
            <Toggle on={form.isActive} label="Продаётся" onChange={(isActive) => set({ isActive })} />
          </div>
        </Field>
      </div>
      <Field label="Описание (видят студенты)">
        <TextArea value={form.description} onChange={(e) => set({ description: e.target.value })} />
      </Field>
      <div className="flex items-center gap-3 rounded-xl border border-neutral-100 px-3.5 py-3">
        <Toggle on={form.isGroup} label="Для группы" onChange={(isGroup) => set({ isGroup })} />
        <div className="flex-1 text-[13px]">
          <div className="font-medium">Для группы</div>
          <div className="text-xs text-neutral-500">Студент платит за одногруппников; уже подписанные не считаются</div>
        </div>
        {form.isGroup && (
          <Field label="Минимум человек" className="w-32">
            <TextInput inputSize="sm" numeric value={form.minSeats} onChange={(e) => set({ minSeats: digits(e.target.value) })} />
          </Field>
        )}
      </div>
      {plan && <Callout tone="warn">Новая цена и срок действуют только на новые счета. Выставленные QR и уже выданные периоды не меняются.</Callout>}
      <ErrorNote error={mutation.error} />
      <ModalActions>
        <Button size="xl" onClick={onClose}>
          Отмена
        </Button>
        <Button size="xl" variant="primary" disabled={!input || mutation.isPending} onClick={save}>
          {mutation.isPending ? "Сохраняем…" : plan ? "Сохранить" : "Создать тариф"}
        </Button>
      </ModalActions>
    </Modal>
  );
}
