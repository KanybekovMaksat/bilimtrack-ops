import { useState } from "react";
import { useNavigate } from "react-router";
import { LEAD_NOTE, LEAD_STATUSES, leadStatusTone, useLeads, type Lead, type LeadStatus } from "@/entities/lead";
import { routes } from "@/shared/config";
import { cn } from "@/shared/lib";
import { Button, Cell, Drawer, FilterChip, Icon, KV, Num, PageHeader, Pill, Row, SearchInput, Segmented, Table } from "@/shared/ui";

const COLS = "92px 148px 168px minmax(200px,1fr) 104px 76px 160px 118px";

export function LeadsPage() {
  const seed = useLeads();
  const navigate = useNavigate();
  const [leads, setLeads] = useState(seed);
  const [open, setOpen] = useState<number | null>(null);
  const [query, setQuery] = useState("");

  const setStatus = (i: number, status: LeadStatus) => setLeads((ls) => ls.map((l, j) => (j === i ? { ...l, status } : l)));
  const visible = leads.map((l, i) => ({ l, i })).filter(({ l }) => !query || `${l.name} ${l.contact}`.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Заявки на демо"
        subtitle="с лендинга, блога и Instagram Direct"
        actions={
          <Segmented
            value="list"
            onChange={(v) => v === "funnel" && navigate(routes.funnel)}
            options={[
              { value: "list", label: "Список" },
              { value: "funnel", label: "Воронка" },
            ]}
          />
        }
      />
      <div className="flex flex-wrap items-center gap-2">
        <SearchInput placeholder="Имя или контакт" value={query} onChange={setQuery} />
        {["Статус", "Тип организации", "Размер", "Источник", "Период"].map((f) => (
          <FilterChip key={f} label={f} />
        ))}
      </div>
      <Table cols={COLS} minWidth={1110} head={["Дата", "Имя", "Контакт", "Организация", "Тип", "Размер", "Источник", "Статус"]}>
        {visible.map(({ l, i }) => (
          <Row key={l.name} onClick={() => setOpen(i)}>
            <span className="text-xs text-neutral-500">{l.date}</span>
            <Cell className="text-brand">{l.name}</Cell>
            <Cell className="text-neutral-700">{l.contact}</Cell>
            <Cell>{l.org}</Cell>
            <span className="text-xs text-neutral-500">{l.type}</span>
            <Num className="text-neutral-700">{l.size}</Num>
            <Cell className={cn("text-xs", l.fromArticle ? "text-brand" : "text-neutral-500")}>{l.source}</Cell>
            <StatusSelect value={l.status} onChange={(s) => setStatus(i, s)} />
          </Row>
        ))}
      </Table>
      <p className="m-0 text-xs text-neutral-400">Статус меняется прямо в строке. Клик по строке открывает карточку панелью справа — список остаётся на месте.</p>

      {open !== null && (
        <LeadDrawer
          lead={leads[open]}
          onClose={() => setOpen(null)}
          onPrev={() => setOpen(Math.max(0, open - 1))}
          onNext={() => setOpen(Math.min(leads.length - 1, open + 1))}
          onStatus={(s) => setStatus(open, s)}
        />
      )}
    </div>
  );
}

/** Inline status pill that opens a small menu, without opening the row. */
function StatusSelect({ value, onChange }: { value: LeadStatus; onChange: (s: LeadStatus) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative" onClick={(e) => e.stopPropagation()}>
      <button onClick={() => setOpen((v) => !v)} className="border-0 bg-transparent p-0">
        <Pill tone={leadStatusTone[value]}>
          {value}
          <Icon name="chevron-down" size={13} className="opacity-70" />
        </Pill>
      </button>
      {open && (
        <div className="absolute top-7 right-0 z-10 w-40 rounded-xl border border-neutral-200 bg-white p-1 shadow-pop">
          {LEAD_STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => {
                onChange(s);
                setOpen(false);
              }}
              className={cn("block w-full rounded-lg border-0 bg-transparent px-2.5 py-1.5 text-left text-xs hover:bg-neutral-100", s === value && "font-semibold text-brand")}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </span>
  );
}

type DrawerProps = { lead: Lead; onClose: () => void; onPrev: () => void; onNext: () => void; onStatus: (s: LeadStatus) => void };

function LeadDrawer({ lead, onClose, onPrev, onNext, onStatus }: DrawerProps) {
  const navigate = useNavigate();
  return (
    <Drawer
      open
      onClose={onClose}
      header={
        <>
          <Button variant="ghost" size="xs" icon="x" onClick={onClose} aria-label="Закрыть" className="text-ink" />
          <div className="flex-1" />
          <Button size="xs" icon="chevron-up" className="font-normal" onClick={onPrev}>
            Пред.
          </Button>
          <Button size="xs" iconRight="chevron-down" className="font-normal" onClick={onNext}>
            След.
          </Button>
        </>
      }
      footer={
        <>
          <Button variant="primary" size="xl" icon="building-plus" className="flex-1" onClick={() => navigate(`${routes.orgNew}?from=lead`)}>
            Завести организацию
          </Button>
          <Button size="xl" className="px-3.5 font-normal" onClick={() => onStatus("Закрыта")}>
            Закрыть заявку
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-[18px] p-[18px]">
        <div>
          <div className="text-lg leading-6 font-semibold">{lead.name}</div>
          <div className="text-[13px] text-neutral-500">
            {lead.org} · {lead.type}
          </div>
        </div>
        <div className="flex gap-1 rounded-full bg-neutral-100 p-[3px]">
          {LEAD_STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => onStatus(s)}
              className={cn("flex-1 rounded-full border-0 py-1.5 text-xs font-medium", s === lead.status ? "bg-brand text-white" : "bg-neutral-100 text-neutral-500")}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-2.5">
          <KV k="Дата" width={120}>
            {lead.date.replace("сен", "сентября 2026")}
          </KV>
          <KV k="Контакт" width={120}>
            {lead.contact}
          </KV>
          <KV k="Организация" width={120}>
            {lead.org}
            {lead.city && `, ${lead.city}`}
          </KV>
          <KV k="Тип" width={120}>
            {lead.type}
          </KV>
          <KV k="Размер" width={120}>
            {lead.size} учащихся
          </KV>
          <KV k="Источник" width={120}>
            {lead.source === "Лендинг" ? "Форма на лендинге · /demo" : lead.source}
          </KV>
        </div>
        <div>
          <div className="mb-1.5 text-xs text-neutral-400">Заметки менеджера</div>
          <div className="min-h-[72px] rounded-xl border border-neutral-200 px-3 py-2.5 text-[13px] leading-[19px] text-neutral-700">{LEAD_NOTE}</div>
        </div>
        <div>
          <div className="mb-1.5 text-xs text-neutral-400">История изменений</div>
          {[
            { text: "Заявка получена с формы лендинга", who: "Система", time: lead.date },
            { text: `Статус: ${lead.status}`, who: "Система", time: lead.date },
          ].map((h) => (
            <div key={h.text} className="flex gap-2 border-b border-neutral-50 py-[7px]">
              <Icon name="point" size={16} className="text-neutral-300" />
              <div className="flex-1">
                <div className="text-xs">{h.text}</div>
                <div className="text-[11px] text-neutral-400">
                  {h.who} · {h.time}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Drawer>
  );
}
