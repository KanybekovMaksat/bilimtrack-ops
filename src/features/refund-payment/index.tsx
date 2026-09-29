import { useState } from "react";
import { formatMoney, useRefundPayment, type PaymentDetail } from "@/entities/payment";
import { Button, Callout, ErrorNote, Field, KV, Modal, ModalActions, TextArea } from "@/shared/ui";

/**
 * Records a refund (POST ops/billing/payments/:id/refund/). Finik has no refund API: the money is
 * returned in their cabinet first, this marks the payment and revokes the unused access.
 */
export function RefundButton({ payment }: { payment: PaymentDetail }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const refund = useRefundPayment(payment.id);
  const amount = formatMoney(payment.amount, payment.currency);
  const recipients = payment.recipients.length || 1;

  return (
    <>
      <Button size="xl" variant="dangerOutline" className="px-4" disabled={payment.status !== "paid"} onClick={() => setOpen(true)}>
        Оформить возврат
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title={`Отметить возврат ${amount}?`}>
        <div className="flex flex-col gap-[9px]">
          <KV k="Плательщик" width={150}>
            {payment.user.fullName} · <span className="font-num">{payment.user.username}</span>
          </KV>
          <KV k="Сумма" width={150}>
            <span className="font-num">{amount}</span>
          </KV>
          <KV k="Транзакция Finik" width={150}>
            <span className="font-num">{payment.providerTransactionId || "—"}</span>
          </KV>
          <KV k="Что с доступом" width={150}>
            {recipients > 1 ? `у ${recipients} получателей` : "у получателя"} снимется неиспользованный остаток
          </KV>
        </div>
        <Field label="Причина возврата — обязательно">
          <TextArea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Двойная оплата, подтверждено в кабинете Finik" />
        </Field>
        <Callout tone="danger">Сначала верните деньги в кабинете Finik — у них нет API возвратов. Здесь только фиксируется факт, отменить его нельзя.</Callout>
        <ErrorNote error={refund.error} />
        <ModalActions>
          <Button size="xl" onClick={() => setOpen(false)}>
            Отмена
          </Button>
          <Button
            size="xl"
            variant="danger"
            disabled={!reason.trim() || refund.isPending}
            onClick={() => refund.mutate(reason.trim(), { onSuccess: () => setOpen(false) })}
          >
            {refund.isPending ? "Отмечаем…" : "Деньги вернули"}
          </Button>
        </ModalActions>
      </Modal>
    </>
  );
}
