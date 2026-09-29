import { useState } from "react";
import { useParams } from "react-router";
import { planDuration, usePlans } from "@/entities/plan";
import { useCan } from "@/entities/session";
import { PlanFormModal } from "@/features/manage-plan";
import { routes } from "@/shared/config";
import { formatDateLong, formatInt, formatNumber } from "@/shared/lib";
import { Breadcrumbs, Button, Card, EmptyState, KV, PageTitle, Pill } from "@/shared/ui";

export function PlanPage() {
  const { code = "" } = useParams();
  const plan = usePlans().find((p) => p.code === code);
  const can = useCan();
  const [editing, setEditing] = useState(false);

  if (!plan) return <EmptyState icon="credit-card" title="Тариф не найден" description={`Кода «${code}» нет среди тарифов.`} />;

  return (
    <div className="flex max-w-[900px] flex-col gap-4">
      <Breadcrumbs items={[{ label: "Тарифы", to: routes.plans }, { label: plan.name }]} />
      <div className="flex items-center gap-3">
        <PageTitle>{plan.name}</PageTitle>
        <Pill tone={plan.isActive ? "success" : "neutral"}>{plan.isActive ? "Продаётся" : "Снят с продажи"}</Pill>
        {plan.isGroup && <Pill tone="info">Для группы</Pill>}
        <div className="flex-1" />
        {can("billing") && (
          <Button variant="primary" icon="pencil" onClick={() => setEditing(true)}>
            Изменить
          </Button>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3.5">
        <Card className="flex flex-col gap-2.5 p-[18px]">
          <div className="text-sm font-medium">Условия</div>
          <KV k="Код" width={170}>
            <span className="font-num">{plan.code}</span>
          </KV>
          <KV k={plan.isGroup ? "Цена за человека" : "Цена"} width={170}>
            <span className="font-num">{formatNumber(plan.price, 2)} {plan.currency}</span>
          </KV>
          <KV k="Срок" width={170}>
            {planDuration(plan)}
          </KV>
          {plan.isGroup && (
            <KV k="Минимум человек" width={170}>
              <span className="font-num">{plan.minSeats}</span>
            </KV>
          )}
          <KV k="Порядок на витрине" width={170}>
            <span className="font-num">{plan.sortOrder}</span>
          </KV>
          <KV k="Описание" width={170}>
            {plan.description || "—"}
          </KV>
        </Card>
        <Card className="flex flex-col gap-2.5 p-[18px]">
          <div className="text-sm font-medium">Продажи</div>
          <KV k="Оплат" width={170}>
            <span className="font-num">{formatInt(plan.salesCount)}</span>
          </KV>
          <KV k="Выручка" width={170}>
            <span className="font-num">{formatNumber(plan.revenue, 0)} {plan.currency}</span>
          </KV>
          <KV k="Создан" width={170}>
            {formatDateLong(plan.createdAt)}
          </KV>
          <KV k="Изменён" width={170}>
            {formatDateLong(plan.updatedAt)}
          </KV>
          <div className="mt-1 text-xs leading-[17px] text-neutral-500">
            Удалить тариф нельзя — на него ссылаются платежи. Снятый с продажи тариф пропадает с экрана /pro, оплаченные периоды доживают свой срок.
          </div>
        </Card>
      </div>
      {editing && <PlanFormModal plan={plan} onClose={() => setEditing(false)} />}
    </div>
  );
}
