import { orgBillingTone, SEED_ORG_PAYMENTS, useOrgBilling, useOrgPayments } from "@/entities/org-billing";
import { AddOrgPaymentButton } from "@/features/add-org-payment";
import { Callout, Card, CardHeader, Cell, Icon, Num, OrgMark, PageHeader, Pill, Row, Table } from "@/shared/ui";

const PAY_COLS = "120px minmax(170px,1fr) 130px 170px 180px 120px";

export function OrgBillingPage() {
  const data = useOrgBilling();
  const added = useOrgPayments((s) => s.added);
  const payments = [...added, ...SEED_ORG_PAYMENTS];

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Биллинг организаций"
        subtitle="сколько учебное заведение платит нам · не путать с PRO-подписками учащихся"
        actions={<AddOrgPaymentButton variant="primary" />}
      />
      <Callout tone="warn" className="py-[11px]">
        Автоматической оплаты здесь нет: организации платят по счёту и договору. Пока модели в коде нет, платежи и статистика ведутся вручную — экран рассчитан именно на такой режим.
      </Callout>
      <div className="grid grid-cols-4 gap-3">
        {data.summary.map((x) => (
          <Card key={x.label} className="px-4 py-3.5">
            <div className="font-num text-xl leading-[1.2] font-semibold" style={{ color: x.color }}>
              {x.n}
            </div>
            <div className="text-xs text-neutral-500">{x.label}</div>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-3">
        {data.plans.map((p) => (
          <Card key={p.name} className="flex flex-col gap-2 p-4">
            <div className="flex items-center gap-2">
              <span className="flex-1 text-[15px] font-semibold">{p.name}</span>
              <span className="text-xs text-neutral-400">{p.orgs} орг.</span>
            </div>
            <div className="font-num text-sm font-medium">{p.price}</div>
            <div className="text-xs leading-[17px] text-neutral-500">{p.note}</div>
          </Card>
        ))}
      </div>
      <Table
        cols="minmax(190px,1fr) 140px 100px 140px 90px 120px 130px 120px"
        minWidth={1060}
        head={["Организация", "Тариф", "Учащихся", "Расчёт", "Период", "Оплачено до", "Сумма", "Статус"]}
      >
        {data.rows.map((r) => (
          <Row key={r.org} hover className={r.status === "Просрочено" ? "bg-warn-row" : undefined}>
            <span className="flex min-w-0 items-center gap-2">
              <OrgMark short={r.orgShort} size={20} />
              <Cell className="font-medium">{r.org}</Cell>
            </span>
            <span className="text-xs text-neutral-700">{r.plan}</span>
            <Num>{r.students}</Num>
            <Num className="text-neutral-500">{r.calc}</Num>
            <span className="text-xs text-neutral-500">{r.period}</span>
            <span className="text-xs text-neutral-500">{r.paidTo}</span>
            <Num className="text-[13px] font-medium">{r.sum}</Num>
            <span>
              <Pill tone={orgBillingTone[r.status]}>{r.status}</Pill>
            </span>
          </Row>
        ))}
      </Table>
      <Card className="overflow-hidden">
        <CardHeader title="Платежи организаций" subtitle="Вносятся вручную сотрудником и попадают в аудит" action={<AddOrgPaymentButton size="sm" label="Добавить" />} />
        <div className="grid gap-3 border-b border-neutral-200 bg-neutral-50 px-4 py-[9px] text-[11px] font-semibold text-neutral-500" style={{ gridTemplateColumns: PAY_COLS }}>
          {["Дата", "Организация", "Сумма", "Способ", "Период", "Внёс"].map((h) => (
            <span key={h}>{h}</span>
          ))}
        </div>
        {payments.map((p, i) => (
          <div key={i} className={`border-b border-neutral-100 px-4 py-2.5 last:border-b-0 ${p.fresh ? "bg-green-50" : ""}`}>
            <div className="grid items-center gap-3 text-[13px]" style={{ gridTemplateColumns: PAY_COLS }}>
              <span className="text-xs text-neutral-500">{p.date}</span>
              <span className="font-medium">{p.org}</span>
              <span className="font-num font-medium">{p.sum}</span>
              <span className="text-xs text-neutral-700">{p.method}</span>
              <span className="text-xs text-neutral-500">{p.period}</span>
              <span className="text-xs text-neutral-500">{p.by}</span>
            </div>
            {(p.note || p.receipt) && (
              <div className="mt-[5px] flex items-center gap-2.5">
                <span className="text-xs text-neutral-400">{p.note}</span>
                {p.receipt && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-brand">
                    <Icon name="paperclip" size={14} />
                    квитанция.pdf
                  </span>
                )}
              </div>
            )}
          </div>
        ))}
      </Card>
    </div>
  );
}
