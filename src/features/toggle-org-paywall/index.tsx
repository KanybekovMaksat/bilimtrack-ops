import { useState } from "react";
import { useCan } from "@/entities/session";
import { useOrgPaywall, useUpdateOrgPaywall } from "@/entities/subscription";
import { formatDateLong, formatInt } from "@/shared/lib";
import { Button, Callout, Card, ErrorNote, Field, KV, Modal, ModalActions, Pill, TextInput, Toggle } from "@/shared/ui";

/** «2026-10-01T00:00» for <input type="datetime-local"> from an ISO string. */
const toLocalInput = (iso: string | null) => (iso ? new Date(new Date(iso).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "");

/**
 * Organization paywall (GET/PATCH ops/organizations/:id/billing/): with it on, learners of the
 * organization without Bilimtrack+ get 402 on the whole student portal from `requiredFrom`.
 */
export function OrgPaywallPanel({ organizationId, orgName }: { organizationId: number; orgName: string }) {
  const paywall = useOrgPaywall(organizationId);
  const update = useUpdateOrgPaywall(organizationId);
  const can = useCan();
  const [confirming, setConfirming] = useState(false);
  const [from, setFrom] = useState(toLocalInput(paywall.requiredFrom));
  const without = paywall.learnersCount - paywall.learnersWithSubscription;

  const turnOn = () =>
    update.mutate(
      { studentSubscriptionRequired: true, requiredFrom: from ? new Date(from).toISOString() : null },
      { onSuccess: () => setConfirming(false) },
    );

  return (
    <Card className="flex flex-col gap-4 p-[18px]">
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 text-sm font-semibold">
            Обязательная подписка Bilimtrack+
            {paywall.studentSubscriptionRequired && (
              <Pill size="sm" tone={paywall.paywallActive ? "danger" : "warn"}>
                {paywall.paywallActive ? "портал закрыт без подписки" : `с ${formatDateLong(paywall.requiredFrom)}`}
              </Pill>
            )}
          </div>
          <div className="text-xs text-neutral-500">
            Студенты без подписки видят только экран оплаты. Сотрудников и родителей не касается.
          </div>
        </div>
        <Toggle
          on={paywall.studentSubscriptionRequired}
          label="Обязательная подписка"
          disabled={!can("billing") || update.isPending}
          onChange={(on) => (on ? setConfirming(true) : update.mutate({ studentSubscriptionRequired: false }))}
        />
      </div>
      <div className="flex flex-col gap-[9px] border-t border-neutral-100 pt-3">
        <KV k="Учащихся с аккаунтом" width={200}>
          <span className="font-num">{formatInt(paywall.learnersCount)}</span>
        </KV>
        <KV k="Из них с подпиской" width={200}>
          <span className="font-num">{formatInt(paywall.learnersWithSubscription)}</span>
        </KV>
      </div>
      {!can("billing") && <div className="text-xs text-neutral-400">Менять может администратор с привилегией «Bilimtrack+».</div>}
      <ErrorNote error={update.error} />

      <Modal open={confirming} onClose={() => setConfirming(false)} width={520} title={`Включить обязательную подписку у ${orgName}?`}>
        <div className="text-[13px] leading-5 text-neutral-700">
          {formatInt(without)} учащихся без подписки потеряют доступ к порталу и увидят экран оплаты Bilimtrack+. Изменение доходит до всех серверов в
          течение минуты.
        </div>
        <Field label="Действует с (пусто — сразу). Дайте студентам время узнать заранее">
          <TextInput inputSize="md" type="datetime-local" value={from} onChange={(e) => setFrom(e.target.value)} />
        </Field>
        <Callout tone="warn">Проверьте, что в Finik настроены ключи: иначе оплатить будет нельзя, а портал уже закроется.</Callout>
        <ErrorNote error={update.error} />
        <ModalActions>
          <Button size="xl" onClick={() => setConfirming(false)}>
            Отмена
          </Button>
          <Button size="xl" variant="danger" disabled={update.isPending} onClick={turnOn}>
            {update.isPending ? "Включаем…" : "Включить"}
          </Button>
        </ModalActions>
      </Modal>
    </Card>
  );
}
