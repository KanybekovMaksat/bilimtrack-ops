import { useState } from "react";
import { useNavigate } from "react-router";
import { LEAD_STATUSES, leadStatusLabel, leadStatusTone, useLeads, useUpdateLeadStatus, type Lead, type LeadStatus } from "@/entities/lead";
import { formatDateTime } from "@/entities/ticket";
import { routes } from "@/shared/config";
import { cn } from "@/shared/lib";
import { Button, Cell, Drawer, EmptyState, FilterChip, Icon, KV, Num, PageHeader, Pill, Row, SearchInput, Table } from "@/shared/ui";

const COLS = "112px 148px 168px minmax(200px,1fr) 104px 96px 190px 128px";

export function LeadsPage() {
  const leads = useLeads();
  const update = useUpdateLeadStatus();
  const [openId, setOpenId] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<LeadStatus | null>(null);

  const q = query.trim().toLowerCase();
  const rows = leads.filter((l) => (!status || l.status === status) && (!q || `${l.name} ${l.contact} ${l.org}`.toLowerCase().includes(q)));
  const openIndex = rows.findIndex((l) => l.id === openId);
  const open = openIndex >= 0 ? rows[openIndex] : null;
  const setLeadStatus = (id: number, s: LeadStatus) => update.mutate({ id, status: s });
  const cycleStatus = () => setStatus((s) => (s === null ? LEAD_STATUSES[0] : (LEAD_STATUSES[LEAD_STATUSES.indexOf(s) + 1] ?? null)));

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Заявки на демо" subtitle="с лендинга и блога bilimtrack.kg" />
      <div className="flex flex-wrap items-center gap-2">
        <SearchInput placeholder="Имя, контакт, организация" value={query} onChange={setQuery} />
        <FilterChip label={status ? `Статус: ${leadStatusLabel[status]}` : "Статус"} tone={status ? "active" : "default"} onClick={cycleStatus} />
        <div className="flex-1" />
        <span className="text-[13px] text-neutral-500">Новых: {leads.filter((l) => l.status === "new").length}</span>
      </div>
      {update.error && <div className="rounded-xl bg-red-50 px-3.5 py-2.5 text-xs text-red-600">Статус не сохранён: {update.error.message}</div>}
      {rows.length ? (
        <Table cols={COLS} minWidth={1140} head={["Дата", "Имя", "Контакт", "Организация", "Тип", "Размер", "Источник", "Статус"]}>
          {rows.map((l) => (
            <Row key={l.id} onClick={() => setOpenId(l.id)}>
              <span className="text-xs text-neutral-500">{formatDateTime(l.createdAt)}</span>
              <Cell className="text-brand">{l.name}</Cell>
              <Cell className="text-neutral-700">{l.contact}</Cell>
              <Cell>{l.org}</Cell>
              <span className="text-xs text-neutral-500">{l.type}</span>
              <Num className="text-neutral-700">{l.size}</Num>
              <Cell className={cn("text-xs", l.article ? "text-brand" : "text-neutral-500")}>{l.source}</Cell>
              <StatusSelect value={l.status} onChange={(s) => setLeadStatus(l.id, s)} />
            </Row>
          ))}
        </Table>
      ) : (
        <div className="rounded-xl border border-neutral-200">
          <EmptyState icon="inbox-off" title={leads.length ? "По фильтрам ничего не найдено" : "Заявок пока нет"} description="Заявки приходят с формы «Запросить демо» на лендинге и в статьях блога." />
        </div>
      )}
      <p className="m-0 text-xs text-neutral-400">Статус меняется прямо в строке. Клик по строке открывает карточку панелью справа — список остаётся на месте.</p>

      {open && (
        <LeadDrawer
          lead={open}
          onClose={() => setOpenId(null)}
          onPrev={() => setOpenId(rows[Math.max(0, openIndex - 1)].id)}
          onNext={() => setOpenId(rows[Math.min(rows.length - 1, openIndex + 1)].id)}
          onStatus={(s) => setLeadStatus(open.id, s)}
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
          {leadStatusLabel[value]}
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
              {leadStatusLabel[s]}
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
          <Button size="xl" className="px-3.5 font-normal" disabled={lead.status === "closed"} onClick={() => onStatus("closed")}>
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
              {leadStatusLabel[s]}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-2.5">
          <KV k="Дата" width={120}>
            {formatDateTime(lead.createdAt)}
          </KV>
          <KV k="Контакт" width={120}>
            {lead.contact}
          </KV>
          <KV k="Организация" width={120}>
            {lead.org}
          </KV>
          <KV k="Тип" width={120}>
            {lead.type}
          </KV>
          <KV k="Размер" width={120}>
            {lead.size} учащихся
          </KV>
          <KV k="Источник" width={120}>
            {lead.source}
          </KV>
        </div>
      </div>
    </Drawer>
  );
}
