import { useState } from "react";
import { PAYMENT_METHODS, useOrgPayments } from "@/entities/org-billing";
import { Button, Callout, Field, Icon, Modal, ModalActions, TextArea, TextInput, type ButtonProps } from "@/shared/ui";
import { cn } from "@/shared/lib";

/** Manual entry of an institution's payment (there is no automatic B2B billing yet). */
export function AddOrgPaymentButton({ label = "Добавить платёж", ...buttonProps }: { label?: string } & ButtonProps) {
  const [open, setOpen] = useState(false);
  const add = useOrgPayments((s) => s.add);
  const [form, setForm] = useState({ org: "НИШ Алматы", sum: "14 700", date: "20.09.2026", period: "сентябрь 2026", method: PAYMENT_METHODS[0], note: "" });
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  return (
    <>
      <Button icon="plus" onClick={() => setOpen(true)} {...buttonProps}>
        {label}
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} width={560} title="Добавить платёж организации">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Организация">
            <TextInput inputSize="md" value={form.org} onChange={(e) => set({ org: e.target.value })} />
          </Field>
          <Field label="Сумма, KGS">
            <TextInput inputSize="md" numeric value={form.sum} onChange={(e) => set({ sum: e.target.value })} />
          </Field>
          <Field label="Дата платежа">
            <TextInput inputSize="md" numeric value={form.date} onChange={(e) => set({ date: e.target.value })} />
          </Field>
          <Field label="Период, за который платят">
            <TextInput inputSize="md" value={form.period} onChange={(e) => set({ period: e.target.value })} />
          </Field>
        </div>
        <div>
          <div className="mb-1.5 text-xs text-neutral-500">Способ оплаты</div>
          <div className="flex flex-wrap gap-1.5">
            {PAYMENT_METHODS.map((m) => (
              <button
                key={m}
                onClick={() => set({ method: m })}
                className={cn(
                  "h-8 rounded-full border px-[13px] text-[13px]",
                  form.method === m ? "border-brand bg-brand-50 text-brand" : "border-neutral-200 bg-white hover:bg-neutral-100",
                )}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
        <Field label="Комментарий">
          <TextArea className="min-h-[60px]" value={form.note} onChange={(e) => set({ note: e.target.value })} placeholder="Номер платёжного поручения, договор" />
        </Field>
        <div className="flex items-center gap-2.5 rounded-[14px] border border-dashed border-neutral-200 p-3.5 text-[13px] text-neutral-500">
          <Icon name="paperclip" size={18} className="text-neutral-400" />
          Приложить квитанцию или счёт
        </div>
        <Callout tone="muted">
          Платёж внесён вручную: в журнале будет видно, кто его добавил. Статус организации пересчитается — «Ожидает» станет «Оплачено».
        </Callout>
        <ModalActions>
          <Button size="xl" onClick={() => setOpen(false)}>
            Отмена
          </Button>
          <Button
            size="xl"
            variant="primary"
            onClick={() => {
              add({ date: "20 сен 2026", org: form.org, sum: `${form.sum} KGS`, method: form.method, period: form.period, by: "Айдана С.", note: form.note || "внесено вручную", receipt: true });
              setOpen(false);
            }}
          >
            Добавить платёж
          </Button>
        </ModalActions>
      </Modal>
    </>
  );
}
