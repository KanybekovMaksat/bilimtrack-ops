import { useState } from "react";
import { useNavigate } from "react-router";
import { SLA_POLICY, slaStrip, ticketTabs, useEscalations, useTickets, type Ticket } from "@/entities/ticket";
import { routes } from "@/shared/config";
import { plural } from "@/shared/lib";
import { Button, FilterChip, Icon, PageHeader, SearchInput, Tabs } from "@/shared/ui";
import { TicketsTable } from "@/widgets/tickets-table";

type TabKey = (typeof ticketTabs)[number]["key"];

const byTab: Record<TabKey, (t: Ticket) => boolean> = {
  mine: (t) => t.id === "TCK-A3F92KD1" || t.id === "TCK-C40ZR9P2",
  open: (t) => t.status === "open" || t.status === "work",
  work: (t) => t.status === "work",
  done: (t) => t.status === "done",
  all: () => true,
};

export function TicketsPage() {
  const tickets = useTickets();
  const navigate = useNavigate();
  const escalated = Object.keys(useEscalations((s) => s.byTicket)).length;
  const [tab, setTab] = useState<TabKey>("open");
  const [query, setQuery] = useState("");
  const [urgentOnly, setUrgentOnly] = useState(false);

  const q = query.trim().toLowerCase();
  const rows = tickets
    .filter(byTab[tab])
    .filter((t) => !urgentOnly || t.priority === "crit" || t.priority === "high")
    .filter((t) => !q || `${t.id} ${t.subject} ${t.author}`.toLowerCase().includes(q));

  const strip = [
    { n: slaStrip.overdue, l: "просрочено", icon: "alarm", c: "#fb2c36", bg: "#fef2f2" },
    { n: slaStrip.soon, l: "истекает в течение часа", icon: "clock", c: "#c2410c", bg: "#fffbeb" },
    { n: slaStrip.ok, l: "в норме", icon: "circle-check", c: "#00a63e", bg: "#fafafa" },
    { n: escalated, l: "в бэклоге разработки", icon: "git-pull-request", c: "#155dfc", bg: "#eff6ff" },
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
      <Tabs items={ticketTabs.map((t) => ({ ...t }))} value={tab} onChange={setTab} />
      <div className="flex flex-wrap items-center gap-2">
        <SearchInput width={260} placeholder="Тема, номер, автор" value={query} onChange={setQuery} />
        <FilterChip label="Приоритет: Высокий +" tone={urgentOnly ? "active" : "default"} onClick={() => setUrgentOnly((v) => !v)} />
        {["Категория", "Источник", "Организация", "Период"].map((f) => (
          <FilterChip key={f} label={f} />
        ))}
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
      <TicketsTable tickets={rows} />
    </div>
  );
}
