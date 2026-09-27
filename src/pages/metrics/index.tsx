import { useNavigate } from "react-router";
import { HealthPill, usageColor } from "@/entities/client-health";
import { useMetrics } from "@/entities/metrics";
import { routes } from "@/shared/config";
import { Card, CardHeader, Delta, Meter, PageHeader } from "@/shared/ui";

export function MetricsPage() {
  const m = useMetrics();
  const navigate = useNavigate();
  const toOrg = () => navigate(routes.orgs);
  const top = m.funnel[0].n;

  return (
    <div className="flex max-w-[1280px] flex-col gap-4">
      <PageHeader title="Сводные метрики" subtitle="договоры учреждений, продления и использование · сентябрь 2026" />
      <div className="grid grid-cols-4 gap-3">
        {m.kpi.map((k) => (
          <Card key={k.label} className="flex flex-col gap-1 p-4">
            <div className="text-xs text-neutral-500">{k.label}</div>
            <div className="flex items-baseline gap-2">
              <span className="font-num text-[26px] leading-8 font-semibold">{k.value}</span>
              <Delta value={k.delta} good={k.good} />
            </div>
            <div className="text-xs text-neutral-400">{k.sub}</div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] items-stretch gap-4">
        <Card className="p-4">
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-medium">Годовая выручка по договорам, млн KGS</span>
            <span className="text-xs text-neutral-400">12 месяцев</span>
          </div>
          <div className="mt-3.5 flex h-[190px] items-end gap-2">
            {m.revenue.map((v, i) => (
              <div key={m.months[i]} className="flex flex-1 flex-col items-center gap-1.5">
                <span className="font-num text-[10px] text-neutral-500">{v.toFixed(1).replace(".", ",")}</span>
                <div
                  className="w-full rounded-[6px_6px_2px_2px]"
                  style={{ height: Math.round(((v - 8) / 5) * 140), background: i === m.revenue.length - 1 ? "var(--color-brand)" : "var(--color-brand-100)" }}
                />
                <span className="text-[11px] text-neutral-400">{m.months[i]}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card className="flex flex-col gap-3 p-4">
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-medium">От заявки до договора</span>
            <span className="text-xs text-neutral-400">12 месяцев</span>
          </div>
          {m.funnel.map((f, i) => (
            <div key={f.label} className="flex flex-col gap-[5px]">
              <div className="flex justify-between text-[13px]">
                <span>{f.label}</span>
                <span className="flex gap-2">
                  <span className="font-num font-semibold">{f.n}</span>
                  <span className="w-10 text-right text-xs text-neutral-500">{i ? `${Math.round((f.n / m.funnel[i - 1].n) * 100)}%` : ""}</span>
                </span>
              </div>
              <Meter height={8} value={Math.max(4, Math.round((f.n / top) * 100))} color={i === m.funnel.length - 1 ? "var(--color-green-600)" : "var(--color-brand)"} />
            </div>
          ))}
          <div className="mt-auto text-xs leading-[17px] text-neutral-500">Пилот → договор: 5 из 12 (42%). Среднее время от пилота до подписания — 38 дней.</div>
        </Card>
      </div>

      <div className="grid grid-cols-2 items-start gap-4">
        <Card className="overflow-hidden">
          <CardHeader title="Использование по учреждениям" subtitle={<span className="text-neutral-400">доля пользователей, заходивших за 7 дней</span>} />
          {m.usage.map((u) => (
            <div
              key={u.org}
              onClick={toOrg}
              className="grid cursor-pointer grid-cols-[minmax(0,1fr)_150px_44px_70px] items-center gap-3 border-b border-neutral-50 px-4 py-[9px] text-[13px] last:border-b-0 hover:bg-neutral-50"
            >
              <span className="truncate">{u.org}</span>
              <Meter value={u.value} color={usageColor(u.value)} />
              <span className="text-right font-num text-xs">{u.value}%</span>
              <span className={`text-right text-xs ${u.delta.startsWith("▲") ? "text-green-600" : "text-red-600"}`}>{u.delta} п.п.</span>
            </div>
          ))}
        </Card>
        <Card className="overflow-hidden">
          <CardHeader title="Продления в ближайшие 90 дней" subtitle={<span className="text-neutral-400">6 договоров · 2,4 млн KGS в год</span>} />
          {m.renewals.map((r) => (
            <div
              key={r.org}
              onClick={toOrg}
              className="grid cursor-pointer grid-cols-[minmax(0,1fr)_96px_92px_110px] items-center gap-3 border-b border-neutral-50 px-4 py-2.5 text-[13px] last:border-b-0 hover:bg-neutral-50"
            >
              <span className="truncate font-medium">{r.org}</span>
              <span>
                <HealthPill tone={r.tone} />
              </span>
              <span className="text-xs text-neutral-700">{r.date}</span>
              <span className="text-right font-num text-xs">{r.sum}</span>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
