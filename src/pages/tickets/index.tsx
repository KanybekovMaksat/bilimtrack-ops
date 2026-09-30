import { CATEGORY, PRIORITY, SLA_POLICY, SOURCE, useTickets, type Ticket } from "@/entities/ticket";
import { plural, useUrlFilters, useUrlSearch } from "@/shared/lib";
import { EmptyState, FilterSelect, Icon, type IconName, PageHeader, SearchInput, Tabs } from "@/shared/ui";
import { TicketsTable } from "@/widgets/tickets-table";

const TABS = ["open", "in_progress", "done", "all"] as const;
type TabKey = (typeof TABS)[number];

const byTab: Record<TabKey, (t: Ticket) => boolean> = {
  open: (t) => t.status === "open",
  in_progress: (t) => t.status === "in_progress",
  done: (t) => t.status === "resolved" || t.status === "closed",
  all: () => true,
};

const PRIORITIES = Object.keys(PRIORITY) as Ticket["priority"][];
const CATEGORIES = Object.keys(CATEGORY) as Ticket["category"][];
const SOURCES = Object.keys(SOURCE) as Ticket["source"][];

export function TicketsPage() {
  const tickets = useTickets();
  const f = useUrlFilters();
  const [query, setQuery] = useUrlSearch(f, 250);
  const tab = f.oneOf("tab", TABS) ?? "open";
  const priority = f.oneOf("priority", PRIORITIES);
  const category = f.oneOf("category", CATEGORIES);
  const source = f.oneOf("source", SOURCES);

  const q = query.trim().toLowerCase();
  const rows = tickets
    .filter(byTab[tab])
    .filter((t) => !priority || t.priority === priority)
    .filter((t) => !category || t.category === category)
    .filter((t) => !source || t.source === source)
    .filter((t) => !q || `${t.number} ${t.subject} ${t.author} ${t.contact}`.toLowerCase().includes(q));

  const active = tickets.filter((t) => t.status === "open" || t.status === "in_progress");
  const strip: { n: number; l: string; icon: IconName; c: string; bg: string }[] = [
    { n: active.filter((t) => t.sla.state === "over").length, l: "просрочено", icon: "alarm", c: "var(--color-red-500)", bg: "var(--color-red-50)" },
    { n: active.filter((t) => t.sla.state === "soon").length, l: "истекает в течение часа", icon: "clock", c: "var(--color-warn)", bg: "var(--color-amber-50)" },
    { n: active.filter((t) => t.sla.state === "ok" || t.sla.state === "done").length, l: "в норме", icon: "circle-check", c: "var(--color-green-600)", bg: "var(--color-neutral-50)" },
  ];

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Тикеты"
        subtitle="единый инбокс: обращения из всех учреждений"
      />
      <Tabs
        value={tab}
        onChange={(k) => f.set({ tab: k === "open" ? undefined : k })}
        items={[
          { key: "open", label: "Открытые", count: tickets.filter(byTab.open).length },
          { key: "in_progress", label: "В работе", count: tickets.filter(byTab.in_progress).length },
          { key: "done", label: "Решённые", count: tickets.filter(byTab.done).length },
          { key: "all", label: "Все", count: tickets.length },
        ]}
      />
      <div className="flex flex-wrap items-center gap-2">
        <SearchInput width={260} placeholder="Тема, номер, автор, контакт" value={query} onChange={setQuery} />
        <FilterSelect
          label="Приоритет"
          allLabel="Любой приоритет"
          value={priority}
          onChange={(v) => f.set({ priority: v })}
          options={PRIORITIES.map((p) => ({ value: p, label: PRIORITY[p].label }))}
        />
        <FilterSelect
          label="Категория"
          allLabel="Все категории"
          value={category}
          onChange={(v) => f.set({ category: v })}
          options={CATEGORIES.map((c) => ({ value: c, label: CATEGORY[c] }))}
        />
        <FilterSelect
          label="Источник"
          allLabel="Все источники"
          value={source}
          onChange={(v) => f.set({ source: v })}
          options={SOURCES.map((s) => ({ value: s, label: SOURCE[s].label, icon: SOURCE[s].icon, iconColor: SOURCE[s].color }))}
        />
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
