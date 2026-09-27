import { useState } from "react";
import { paymentTone, usePayments, type Payment } from "@/entities/payment";
import { RefundButton } from "@/features/refund-payment";
import { Button, Callout, Cell, Drawer, FilterChip, Icon, KV, Num, PageHeader, Pill, Row, SearchInput, Table } from "@/shared/ui";

export function PaymentsPage() {
  const payments = usePayments();
  const [open, setOpen] = useState<Payment | null>(null);
  const [query, setQuery] = useState("");
  const [stuckOnly, setStuckOnly] = useState(false);
  const q = query.trim().toLowerCase();
  const rows = payments.filter((p) => (!stuckOnly || p.stuckFor) && (!q || `${p.user} ${p.txn}`.toLowerCase().includes(q)));

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Платежи" subtitle="журнал транзакций" />
      <div className="flex items-center gap-2">
        <SearchInput width={260} placeholder="Плательщик или номер транзакции" value={query} onChange={setQuery} />
        <FilterChip label="Статус" />
        <FilterChip label="Провайдер" />
        <FilterChip tone="warn" icon="alert-triangle" label={`Зависли в обработке · ${payments.filter((p) => p.stuckFor).length}`} onClick={() => setStuckOnly((v) => !v)} />
      </div>
      <Table cols="124px minmax(180px,1fr) 100px 150px 150px 120px 90px" minWidth={1050} head={["Дата", "Плательщик", "Сумма", "Провайдер", "Транзакция", "Статус", "Подарок"]}>
        {rows.map((p) => (
          <Row key={p.txn} onClick={() => setOpen(p)} className={p.stuckFor ? "bg-warn-row" : undefined}>
            <span className="text-xs text-neutral-500">{p.date}</span>
            <Cell className="text-brand">{p.user}</Cell>
            <Num className="text-[13px]">{p.sum}</Num>
            <span className="text-xs text-neutral-700">{p.provider}</span>
            <Num className="text-neutral-500">{p.txn}</Num>
            <span className="flex items-center gap-1.5">
              <Pill tone={paymentTone[p.status]}>{p.status}</Pill>
              {p.stuckFor && <Icon name="alert-triangle" size={15} className="text-amber-500" />}
            </span>
            <span>{p.gift && <Pill tone="info" className="font-normal">Подарок</Pill>}</span>
          </Row>
        ))}
      </Table>
      <p className="m-0 text-xs text-neutral-400">Строка с подсветкой — платёж висит в «В обработке» дольше 15 минут. Это и есть типичное обращение «деньги списались, а PRO нет».</p>

      {open && (
        <Drawer
          open
          onClose={() => setOpen(null)}
          header={
            <>
              <Button variant="ghost" size="xs" icon="x" onClick={() => setOpen(null)} aria-label="Закрыть" className="text-ink" />
              <div className="font-num text-sm font-medium">{open.txn}</div>
            </>
          }
          footer={
            <>
              <Button size="xl" className="flex-1">
                Проверить у провайдера
              </Button>
              <RefundButton payment={open} />
            </>
          }
        >
          <div className="flex flex-col gap-4 p-[18px]">
            <div className="flex items-baseline gap-2.5">
              <div className="font-num text-[26px] font-semibold">{open.sum}</div>
              <Pill tone={paymentTone[open.status]}>{open.status}</Pill>
            </div>
            {open.stuckFor && (
              <Callout tone="warn">Висит в обработке {open.stuckFor}. Провайдер не прислал вебхук. Проверьте статус вручную, прежде чем обещать что-то пользователю.</Callout>
            )}
            <div className="flex flex-col gap-[9px]">
              <KV k="Дата">{open.date}</KV>
              <KV k="Плательщик">
                <span className="text-brand">{open.user}</span>
              </KV>
              <KV k="Провайдер">{open.provider}</KV>
              <KV k="Подписка">PRO · {open.sum === "250 KGS" ? "год" : "месяц"}</KV>
            </div>
            <div>
              <div className="mb-1.5 text-xs text-neutral-400">Ответ провайдера</div>
              <pre className="m-0 overflow-auto rounded-[10px] border border-neutral-100 bg-neutral-50 p-2.5 font-mono text-[11px] leading-4 text-neutral-700">{open.providerResponse}</pre>
            </div>
          </div>
        </Drawer>
      )}
    </div>
  );
}
