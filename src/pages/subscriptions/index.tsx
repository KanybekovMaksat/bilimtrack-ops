import { useState } from "react";
import { subscriptionTone, useSubscriptions } from "@/entities/subscription";
import { cn } from "@/shared/lib";
import { Button, Cell, FilterChip, OrgLabel, PageHeader, Pill, Row, SearchInput, Table } from "@/shared/ui";

export function SubscriptionsPage() {
  const subs = useSubscriptions();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const rows = subs.filter((s) => s.user.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Подписки" subtitle="1 842 активных" />
      <div className="flex flex-wrap items-center gap-2">
        <SearchInput placeholder="Пользователь" value={query} onChange={setQuery} />
        {["План", "Статус", "Период", "Провайдер", "Организация"].map((f) => (
          <FilterChip key={f} label={f} />
        ))}
        <FilterChip tone="warn" icon="clock" label="Истекают за 7 дней · 12" />
      </div>
      <Table
        cols="minmax(180px,1fr) 150px 80px 84px 130px 110px 110px 96px 130px"
        minWidth={1120}
        head={["Пользователь", "Организация", "План", "Период", "Статус", "Начало", "Окончание", "Автопродл.", "Провайдер"]}
      >
        {rows.map((s) => (
          <Row key={s.user} onClick={() => setSelected(s.user === selected ? null : s.user)} className={s.user === selected ? "bg-brand-50 hover:bg-brand-50" : undefined}>
            <Cell className="text-brand">{s.user}</Cell>
            <OrgLabel short={s.orgShort} name={s.org} className="text-xs" />
            <span className="text-xs">{s.plan}</span>
            <span className="text-xs text-neutral-500">{s.period}</span>
            <span>
              <Pill tone={subscriptionTone[s.status]} className={cn(s.status === "Льготный период" && "border border-amber-500")}>
                {s.status}
              </Pill>
            </span>
            <span className="text-xs text-neutral-500">{s.from}</span>
            <span className="text-xs text-neutral-500">{s.to}</span>
            <span className={cn("text-xs", s.autoRenew ? "text-ink" : "text-neutral-400")}>{s.autoRenew ? "Вкл" : "Выкл"}</span>
            <Cell className="text-xs text-neutral-500">{s.provider}</Cell>
          </Row>
        ))}
      </Table>
      <div className="flex gap-2">
        <Button size="md" disabled={!selected}>
          Продлить вручную
        </Button>
        <Button size="md" disabled={!selected}>
          Выдать PRO бесплатно
        </Button>
        <Button size="md" variant="muted" disabled={!selected}>
          Отменить автопродление
        </Button>
        <span className="self-center text-xs text-neutral-400">
          {selected ? `Выбрано: ${selected}. ` : "Выберите подписку в таблице. "}Каждое действие требует причины текстом — она попадает в аудит
        </span>
      </div>
    </div>
  );
}
