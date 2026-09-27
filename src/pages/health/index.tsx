import { useState } from "react";
import { useNavigate } from "react-router";
import {
  HEALTH_FACTORS,
  HEALTH_SUMMARY,
  HEALTH_TONE,
  HealthPill,
  useClientHealth,
  usageColor,
  type HealthTone,
} from "@/entities/client-health";
import { routes } from "@/shared/config";
import { Card, Cell, Meter, OrgMark, PageHeader, Row, Table } from "@/shared/ui";

export function HealthPage() {
  const rows = useClientHealth();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<HealthTone | null>(null);
  const shown = rows.filter((r) => !filter || r.tone === filter);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Здоровье клиентов" subtitle="кто может не продлить договор" />
      <div className="grid grid-cols-[repeat(3,minmax(0,1fr))_minmax(0,1.5fr)] gap-3">
        {HEALTH_SUMMARY.map((h) => {
          const t = HEALTH_TONE[h.tone];
          const on = filter === h.tone;
          return (
            <button
              key={h.tone}
              onClick={() => setFilter(on ? null : h.tone)}
              className="flex flex-col gap-1 rounded-2xl border px-4 py-3.5 text-left"
              style={{ background: on ? t.bg : "#fff", borderColor: on ? t.dot : "#e5e5e5" }}
            >
              <div className="flex items-center gap-[7px] text-[13px] font-medium">
                <span className="size-[9px] rounded-full" style={{ background: t.dot }} />
                {t.label}
              </div>
              <div className="font-num text-[26px] leading-8 font-semibold">{h.count}</div>
              <div className="text-xs text-neutral-500">{h.sub}</div>
            </button>
          );
        })}
        <Card className="flex flex-col gap-1.5 px-4 py-3.5">
          <div className="text-[13px] font-medium">Как считается индекс, 0–100</div>
          {HEALTH_FACTORS.map((f) => (
            <div key={f.k} className="flex justify-between text-xs text-neutral-600">
              <span>{f.k}</span>
              <span className="font-num text-neutral-500">{f.w}</span>
            </div>
          ))}
          <div className="mt-0.5 text-[11px] text-neutral-400">Зелёный — от 75 · Жёлтый — 50–74 · Красный — ниже 50</div>
        </Card>
      </div>

      <Table
        cols="minmax(190px,1fr) 128px 160px 90px 108px 110px 110px minmax(220px,1.3fr)"
        minWidth={1240}
        head={["Организация", "Здоровье", "Активность, 7 дней", "Тикеты", "Договор до", "Продление", "Менеджер", "Почему такой статус"]}
      >
        {shown.map((o) => {
          const renewColor = o.daysToRenewal <= 60 ? "#e7000b" : o.daysToRenewal <= 120 ? "#c2410c" : "#737373";
          return (
            <Row key={o.name} onClick={() => navigate(routes.org(o.slug))}>
              <span className="flex min-w-0 items-center gap-2">
                <OrgMark short={o.short} size={22} />
                <span className="min-w-0">
                  <Cell className="block font-medium">{o.name}</Cell>
                  <span className="block text-[11px] text-neutral-400">{o.type}</span>
                </span>
              </span>
              <span className="flex items-center gap-2">
                <HealthPill tone={o.tone} />
                <span className="font-num text-xs text-neutral-500">{o.score}</span>
              </span>
              <span className="flex flex-col gap-[3px]">
                <span className="flex items-center gap-2">
                  <Meter value={o.activity} color={usageColor(o.activity)} className="flex-1" />
                  <span className="w-8 text-right font-num text-xs">{o.activity}%</span>
                </span>
                <span className="text-[11px] text-neutral-400">вход {o.lastLogin}</span>
              </span>
              <span className="flex flex-col">
                <span className="font-num">{o.tickets}</span>
                {o.critical > 0 && <span className="text-[11px] font-medium text-red-600">{o.critical} критический</span>}
              </span>
              <span className="text-xs text-neutral-700">{o.contractUntil}</span>
              <span className="text-xs" style={{ color: renewColor, fontWeight: o.daysToRenewal <= 60 ? 600 : 400 }}>
                через {o.daysToRenewal} дн.
              </span>
              <span className="text-xs text-brand">{o.manager}</span>
              <span className={`text-xs leading-4 ${o.risk ? "text-neutral-700" : "text-neutral-400"}`}>{o.risk || "Без замечаний"}</span>
            </Row>
          );
        })}
      </Table>
      <div className="text-xs text-neutral-400">Показано {shown.length} из 34 · сортировка: сначала красные, затем по сроку продления</div>
    </div>
  );
}
