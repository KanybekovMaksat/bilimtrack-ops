import { useNavigate } from "react-router";
import { usePlans } from "@/entities/plan";
import { routes } from "@/shared/config";
import { cn } from "@/shared/lib";
import { Button, PageHeader, Pill } from "@/shared/ui";

export function PlansPage() {
  const plans = usePlans();
  const navigate = useNavigate();
  return (
    <div className="flex max-w-[1120px] flex-col gap-4">
      <PageHeader
        title="Тарифы"
        subtitle="что учащиеся платят нам · не путать со счетами учебного заведения"
        actions={
          <Button variant="primary" icon="plus">
            Новый тариф
          </Button>
        }
      />
      <div className="grid grid-cols-3 gap-3.5">
        {plans.map((p) => (
          <button
            key={p.code}
            onClick={() => navigate(routes.plan(p.code))}
            className={cn("flex flex-col gap-3 rounded-2xl border bg-white p-[18px] text-left hover:border-brand", p.active ? "border-neutral-200" : "border-neutral-100")}
          >
            <div className="flex w-full items-center gap-2">
              <div className="flex-1">
                <div className="text-base font-semibold">{p.name}</div>
                <div className="font-num text-[11px] text-neutral-400">{p.code}</div>
              </div>
              <Pill tone={p.active ? "success" : "neutral"}>{p.active ? "Активен" : "Выключен"}</Pill>
            </div>
            <div className="min-h-[34px] text-xs leading-[17px] text-neutral-500">{p.note}</div>
            <div className="flex w-full gap-[18px] border-t border-neutral-100 pt-3">
              <div>
                <div className="font-num text-[15px] font-semibold">{p.monthly}</div>
                <div className="text-[11px] text-neutral-400">в месяц</div>
              </div>
              <div>
                <div className="font-num text-[15px] font-semibold">{p.yearly}</div>
                <div className="text-[11px] text-neutral-400">в год</div>
              </div>
              <div className="ml-auto text-right">
                <div className="font-num text-[15px] font-semibold">{p.subscribers}</div>
                <div className="text-[11px] text-neutral-400">подписчиков</div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
