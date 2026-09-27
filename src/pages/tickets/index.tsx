import { useState } from "react";
import { useNavigate } from "react-router";
import { CATEGORY, SLA_POLICY, SOURCE, useTickets, type Ticket } from "@/entities/ticket";
import { routes } from "@/shared/config";
import { plural } from "@/shared/lib";
import { Button, EmptyState, FilterChip, Icon, PageHeader, SearchInput, Tabs } from "@/shared/ui";
import { TicketsTable } from "@/widgets/tickets-table";

type TabKey = "open" | "in_progress" | "done" | "all";

const byTab: Record<TabKey, (t: Ticket) => boolean> = {
  open: (t) => t.status === "open",
  in_progress: (t) => t.status === "in_progress",
  done: (t) => t.status === "resolved" || t.status === "closed",
  all: () => true,
};

/** Cycles through "all" and each value of a filter on click. */
function useCycle<T extends string>(values: T[]) {
  const [value, setValue] = useState<T | null>(null);
  const next = () => setValue((v) => (v === null ? values[0] : (values[values.indexOf(v) + 1] ?? null)));
  return [value, next] as const;
}

export function TicketsPage() {
  const tickets = useTickets();
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabKey>("open");
  const [query, setQuery] = useState("");
  const [urgentOnly, setUrgentOnly] = useState(false);
  const [category, nextCategory] = useCycle(Object.keys(CATEGORY) as Ticket["category"][]);
  const [source, nextSource] = useCycle(Object.keys(SOURCE) as Ticket["source"][]);

  const q = query.trim().toLowerCase();
  const rows = tickets
    .filter(byTab[tab])
    .filter((t) => !urgentOnly || t.priority === "urgent" || t.priority === "high")
    .filter((t) => !category || t.category === category)
    .filter((t) => !source || t.source === source)
    .filter((t) => !q || `${t.number} ${t.subject} ${t.author} ${t.contact}`.toLowerCase().includes(q));

  const active = tickets.filter((t) => t.status === "open" || t.status === "in_progress");
  const strip = [
    { n: active.filter((t) => t.sla.state === "over").length, l: "просрочено", icon: "alarm", c: "#fb2c36", bg: "#fef2f2" },
    { n: active.filter((t) => t.sla.state === "soon").length, l: "истекает в течение часа", icon: "clock", c: "#c2410c", bg: "#fffbeb" },
    { n: active.filter((t) => t.sla.state === "ok" || t.sla.state === "done").length, l: "в норме", icon: "circle-check", c: "#00a63e", bg: "#fafafa" },
  ];

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Тикеты"
        subtitle="единый инбокс: обращения из всех учреждений"
        actions={
          <Button size="md" icon="layout-list" onClick={() => navigate(routes.ticketStates)}>
            Состояния списка
          </Button>
        }
      />
      <Tabs
        value={tab}
        onChange={setTab}
        items={[
          { key: "open", label: "Открытые", count: tickets.filter(byTab.open).length },
          { key: "in_progress", label: "В работе", count: tickets.filter(byTab.in_progress).length },
          { key: "done", label: "Решённые", count: tickets.filter(byTab.done).length },
          { key: "all", label: "Все", count: tickets.length },
        ]}
      />
      <div className="flex flex-wrap items-center gap-2">
        <SearchInput width={260} placeholder="Тема, номер, автор, контакт" value={query} onChange={setQuery} />
        <FilterChip label="Приоритет: Высокий +" tone={urgentOnly ? "active" : "default"} onClick={() => setUrgentOnly((v) => !v)} />
        <FilterChip label={category ? `Категория: ${CATEGORY[category]}` : "Категория"} tone={category ? "active" : "default"} onClick={nextCategory} />
        <FilterChip label={source ? `Источник: ${SOURCE[source].label}` : "Источник"} tone={source ? "active" : "default"} onClick={nextSource} />
        <div className="flex-1" />
        <span className="text-[13px] text-neutral-500">
          {rows.length} {plural(rows.length, ["тикет", "тикета", "тикетов"])}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {strip.map((x) => (
          <div key={x.l} className="flex items-center gap-2 rounded-xl px-3 py-2 text-[13px]" style={{ background: x.bg }}>
            <Icon name={x.icon} size={16} style={{ color: x.c }} />
            <span className="font-num font-semibold">{x.n}</span>
            <span className="text-neutral-600">{x.l}</span>
          </div>
        ))}
        <div className="flex-1" />
        <span className="text-xs text-neutral-400">{SLA_POLICY}</span>
      </div>
      {rows.length ? (
        <TicketsTable tickets={rows} />
      ) : (
        <div className="rounded-xl border border-neutral-200">
          {tickets.length ? (
            <EmptyState icon="filter-off" title="По вашим фильтрам ничего не найдено" description="Измените вкладку, поиск или фильтры." />
          ) : (
            <EmptyState icon="inbox-off" title="Тикетов пока нет" description="Когда клиент напишет с сайта, из панели, Telegram или через API — обращение появится здесь." />
          )}
        </div>
      )}
    </div>
  );
}
