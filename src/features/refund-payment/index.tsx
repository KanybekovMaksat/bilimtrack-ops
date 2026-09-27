import { useState } from "react";
import type { Payment } from "@/entities/payment";
import { Button, Callout, Field, KV, Modal, ModalActions, TextArea } from "@/shared/ui";

/** Irreversible refund with a mandatory reason. */
export function RefundButton({ payment }: { payment: Payment }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");

  return (
    <>
      <Button size="xl" variant="dangerOutline" className="px-4" onClick={() => setOpen(true)}>
        Оформить возврат
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title={`Оформить возврат ${payment.sum}?`}>
        <div className="flex flex-col gap-[9px]">
          <KV k="Кому" width={150}>
            {payment.user} · {payment.org}
          </KV>
          <KV k="Сумма" width={150}>
            <span className="font-num">{payment.sum}</span>
          </KV>
          <KV k="Провайдер" width={150}>
            {payment.provider} · {payment.txn}
          </KV>
          <KV k="Что с подпиской" width={150}>
            PRO отключится сразу, срок обнулится
          </KV>
        </div>
        <Field label="Причина возврата — обязательно">
          <TextArea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Двойное списание, подтверждено провайдером" />
        </Field>
        <Callout tone="danger">
          Возврат необратим. Деньги уйдут обратно на счёт плательщика, повторно оформить подписку он сможет только новой оплатой.
        </Callout>
        <ModalActions>
          <Button size="xl" onClick={() => setOpen(false)}>
            Отмена
          </Button>
          <Button size="xl" variant="danger" disabled={!reason.trim()} onClick={() => setOpen(false)}>
            Вернуть {payment.sum}
          </Button>
        </ModalActions>
      </Modal>
    </>
  );
}
