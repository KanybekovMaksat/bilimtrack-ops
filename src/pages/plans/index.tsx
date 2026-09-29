import { useState } from "react";
import { useNavigate } from "react-router";
import { planDuration, usePlans } from "@/entities/plan";
import { useCan } from "@/entities/session";
import { useBillingSummary } from "@/entities/subscription";
import { PlanFormModal } from "@/features/manage-plan";
import { routes } from "@/shared/config";
import { cn, formatInt, formatNumber } from "@/shared/lib";
import { Button, EmptyState, PageHeader, Pill } from "@/shared/ui";

export function PlansPage() {
  const plans = usePlans();
  const summary = useBillingSummary();
  const navigate = useNavigate();
  const can = useCan();
  const [creating, setCreating] = useState(false);
  const s = summary.data;

  return (
    <div className="flex max-w-[1120px] flex-col gap-4">
      <PageHeader
        title="Тарифы Bilimtrack+"
        subtitle="что учащиеся платят нам · не путать со счетами учебного заведения"
        actions={
          can("billing") && (
            <Button variant="primary" icon="plus" onClick={() => setCreating(true)}>
              Новый тариф
            </Button>
          )
        }
      />
      {s && (
        <div className="grid grid-cols-4 gap-3.5">
          {[
            ["Активных подписок", formatInt(s.activeSubscribers)],
            ["Из них пробных", formatInt(s.trialSubscribers)],
            ["Истекают за 7 дней", formatInt(s.expiringIn7Days)],
            ["Оплачено в этом месяце", `${formatNumber(Number(s.paidThisMonth.amount), 0)} KGS · ${formatInt(s.paidThisMonth.count)}`],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-neutral-200 bg-white px-4 py-3">
              <div className="font-num text-lg font-semibold">{value}</div>
              <div className="text-[11px] text-neutral-400">{label}</div>
            </div>
          ))}
        </div>
      )}
      {plans.length ? (
        <div className="grid grid-cols-3 gap-3.5">
          {plans.map((p) => (
            <button
              key={p.id}
              onClick={() => navigate(routes.plan(p.code))}
              className={cn("flex flex-col gap-3 rounded-2xl border bg-white p-[18px] text-left hover:border-brand", p.isActive ? "border-neutral-200" : "border-neutral-100 opacity-70")}
            >
              <div className="flex w-full items-center gap-2">
                <div className="flex-1">
                  <div className="text-base font-semibold">{p.name}</div>
                  <div className="font-num text-[11px] text-neutral-400">{p.code}</div>
                </div>
                {p.isGroup && <Pill tone="info">Группа</Pill>}
                <Pill tone={p.isActive ? "success" : "neutral"}>{p.isActive ? "Продаётся" : "Снят"}</Pill>
              </div>
              <div className="min-h-[34px] text-xs leading-[17px] text-neutral-500">{p.description || planDuration(p)}</div>
              <div className="flex w-full gap-[18px] border-t border-neutral-100 pt-3">
                <div>
                  <div className="font-num text-[15px] font-semibold">{formatNumber(p.price, 2)} KGS</div>
                  <div className="text-[11px] text-neutral-400">{p.isGroup ? "с человека" : planDuration(p)}</div>
                </div>
                <div>
                  <div className="font-num text-[15px] font-semibold">{formatInt(p.salesCount)}</div>
                  <div className="text-[11px] text-neutral-400">оплат</div>
                </div>
                <div className="ml-auto text-right">
                  <div className="font-num text-[15px] font-semibold">{formatNumber(p.revenue, 0)}</div>
                  <div className="text-[11px] text-neutral-400">выручка, KGS</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <EmptyState icon="credit-card" title="Тарифов пока нет" description="Создайте первый — он появится на экране /pro у студентов." />
      )}
      {creating && <PlanFormModal onClose={() => setCreating(false)} />}
    </div>
  );
}
