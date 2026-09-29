import { useState } from "react";
import { useSearchParams } from "react-router";
import {
  formatMoney,
  PAYMENTS_PAGE_SIZE,
  paymentStatusLabel,
  paymentTone,
  usePaymentDetail,
  usePayments,
  webhookOutcomeLabel,
  WebhookBody,
  webhookTone,
  type PaymentStatus,
} from "@/entities/payment";
import { useCan } from "@/entities/session";
import { RefundButton } from "@/features/refund-payment";
import { formatDateTimeShort, formatInt, plural, useDebouncedEffect } from "@/shared/lib";
import { Button, Callout, Cell, Drawer, EmptyState, ErrorNote, FilterChip, KV, Num, PageHeader, Pager, Pill, Row, SearchInput, Table } from "@/shared/ui";

const STATUSES: PaymentStatus[] = ["paid", "pending", "expired", "failed", "refunded"];

function PaymentDrawer({ id, onClose }: { id: string; onClose: () => void }) {
  const detail = usePaymentDetail(id);
  const can = useCan();
  const p = detail.data;

  return (
    <Drawer
      open
      onClose={onClose}
      header={
        <>
          <Button variant="ghost" size="xs" icon="x" onClick={onClose} aria-label="Закрыть" className="text-ink" />
          <div className="truncate font-num text-sm font-medium">{id}</div>
        </>
      }
      footer={can("billing") && p ? <RefundButton payment={p} /> : undefined}
    >
      <div className="flex flex-col gap-4 p-[18px]">
        <ErrorNote error={detail.error} />
        {!p ? (
          <div className="h-40 animate-pulse rounded-xl bg-neutral-50" />
        ) : (
          <>
            <div className="flex items-baseline gap-2.5">
              <div className="font-num text-[26px] font-semibold">{formatMoney(p.amount, p.currency)}</div>
              <Pill tone={paymentTone[p.status]}>{paymentStatusLabel[p.status] ?? p.status}</Pill>
            </div>
            {p.failureReason && <Callout tone={p.status === "refunded" ? "muted" : "warn"}>{p.failureReason}</Callout>}
            <div className="flex flex-col gap-[9px]">
              <KV k="Создан">{formatDateTimeShort(p.createdAt)}</KV>
              <KV k="Оплачен">{formatDateTimeShort(p.paidAt)}</KV>
              {p.refundedAt && <KV k="Возврат">{formatDateTimeShort(p.refundedAt)}</KV>}
              <KV k="Плательщик">
                {p.user.fullName} · <span className="font-num">{p.user.username}</span>
              </KV>
              <KV k="Тариф">
                {p.plan.name} · {p.durationDays} дн.
                {p.seats > 1 && ` · ${p.seats} × ${formatMoney(p.unitPrice, p.currency)}`}
              </KV>
              <KV k="Организация">{p.organization?.name ?? "—"}</KV>
              <KV k="Транзакция Finik">
                <span className="font-num">{p.providerTransactionId || "—"}</span>
                {p.providerEnvironment && <span className="ml-1.5 text-neutral-400">({p.providerEnvironment})</span>}
              </KV>
              <KV k="QR действует до">{formatDateTimeShort(p.expiresAt)}</KV>
            </div>
            {p.recipients.length > 1 && (
              <div>
                <div className="mb-1.5 text-xs text-neutral-400">Получатели · {p.recipients.length}</div>
                {p.recipients.map((r) => (
                  <div key={r.id} className="flex gap-2 py-0.5 text-xs">
                    <span className="font-num text-neutral-500">{r.username}</span>
                    <span>{r.fullName}</span>
                  </div>
                ))}
              </div>
            )}
            <div>
              <div className="mb-1.5 text-xs text-neutral-400">Вебхуки Finik</div>
              {p.webhookEvents.length ? (
                p.webhookEvents.map((e) => (
                  <div key={e.id} className="mb-2 rounded-[10px] border border-neutral-100 p-2.5">
                    <div className="mb-1 flex items-center gap-2 text-xs">
                      <Pill size="sm" tone={webhookTone[e.outcome] ?? "neutral"}>
                        {webhookOutcomeLabel[e.outcome] ?? e.outcome}
                      </Pill>
                      <span className="text-neutral-500">{formatDateTimeShort(e.receivedAt)}</span>
                    </div>
                    {e.detail && <div className="mb-1.5 text-xs text-neutral-600">{e.detail}</div>}
                    <WebhookBody body={e.body} />
                  </div>
                ))
              ) : (
                <div className="text-xs text-neutral-400">
                  {p.status === "pending" ? "Вебхука ещё не было: Finik шлёт его только после успешной оплаты." : "Вебхуков нет"}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </Drawer>
  );
}

export function PaymentsPage() {
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState("");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<PaymentStatus | undefined>();
  const [page, setPage] = useState(1);
  const openId = params.get("payment");

  useDebouncedEffect(query.trim(), 350, (next) => {
    setQ(next);
    setPage(1);
  });

  const list = usePayments({ q: q.length >= 2 ? q : undefined, status, page });
  const total = list.data?.count ?? 0;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Платежи Bilimtrack+" subtitle={list.data ? `${formatInt(total)} ${plural(total, ["платёж", "платежа", "платежей"])} · Finik QR` : "журнал оплат через Finik"} />
      <div className="flex flex-wrap items-center gap-2">
        <SearchInput width={300} placeholder="Логин, ФИО, транзакция или ID платежа" value={query} onChange={setQuery} />
        {STATUSES.map((st) => (
          <FilterChip
            key={st}
            label={paymentStatusLabel[st]}
            tone={status === st ? "active" : "default"}
            onClick={() => {
              setStatus(status === st ? undefined : st);
              setPage(1);
            }}
          />
        ))}
        {list.isFetching && <span className="text-xs text-neutral-400">Загрузка…</span>}
      </div>

      {list.error ? (
        <Callout tone="danger">{list.error.message}</Callout>
      ) : list.data && !list.data.rows.length ? (
        <div className="rounded-xl border border-neutral-200">
          <EmptyState icon="credit-card" title="Платежей не найдено" description="Здесь появится каждый счёт, выставленный студентом на экране Bilimtrack+." />
        </div>
      ) : (
        <Table cols="130px minmax(190px,1fr) minmax(150px,1fr) 120px 150px 130px" minWidth={1000} head={["Дата", "Плательщик", "Тариф", "Сумма", "Транзакция", "Статус"]}>
          {(list.data?.rows ?? []).map((p) => (
            <Row key={p.id} onClick={() => setParams({ payment: p.id })} className={openId === p.id ? "bg-brand-50 hover:bg-brand-50" : undefined}>
              <span className="text-xs text-neutral-500">{formatDateTimeShort(p.createdAt)}</span>
              <span className="min-w-0">
                <Cell className="block">{p.user.fullName}</Cell>
                <Cell className="block font-num text-[11px] text-neutral-400">{p.user.username}</Cell>
              </span>
              <Cell className="text-xs">
                {p.plan.name}
                {p.seats > 1 && <span className="text-neutral-400"> × {p.seats}</span>}
              </Cell>
              <Num className="text-[13px]">{formatMoney(p.amount, p.currency)}</Num>
              <Num className="truncate text-neutral-500">{p.providerTransactionId || "—"}</Num>
              <span>
                <Pill tone={paymentTone[p.status]}>{paymentStatusLabel[p.status] ?? p.status}</Pill>
              </span>
            </Row>
          ))}
          {list.isLoading && <div className="h-40 animate-pulse bg-neutral-50" />}
        </Table>
      )}
      {total > PAYMENTS_PAGE_SIZE && <Pager page={page} pageSize={PAYMENTS_PAGE_SIZE} total={total} onPage={setPage} />}
      <p className="m-0 text-xs text-neutral-400">
        «Ожидает оплаты» без вебхука дольше срока QR закрывается автоматически. Если студент говорит, что деньги списались, а доступа нет, — ищите
        транзакцию в «Провайдерах» → вебхуки с пометкой «Требует проверки».
      </p>

      {openId && <PaymentDrawer key={openId} id={openId} onClose={() => setParams({})} />}
    </div>
  );
}
