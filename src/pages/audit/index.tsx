import { Link } from "react-router";
import { JOURNAL_PAGE, diffRows, exportAudit, useAudit, useJournalChoices, type AuditFilters } from "@/entities/journal";
import { useOrganizationsSoft } from "@/entities/organization";
import { routes } from "@/shared/config";
import { formatDateTimeFull, formatDateTimeShort, useUrlFilters, useUrlSearch } from "@/shared/lib";
import { Callout, Cell, EmptyState, ExportButton, FilterChip, FilterReset, FilterSelect, Icon, PageHeader, Pager, PeriodFilter, Pill, SearchInput } from "@/shared/ui";

const COLS = "24px 128px 170px 170px minmax(220px,1fr) 150px 130px";

const ACTION_TONE: Record<string, "success" | "info" | "danger" | "warn" | "neutral"> = {
  created: "success",
  updated: "info",
  deleted: "danger",
  status_changed: "warn",
  password_changed: "warn",
  viewed: "neutral",
};

export function AuditPage() {
  const choices = useJournalChoices();
  const orgs = useOrganizationsSoft().data ?? [];
  const f = useUrlFilters();
  const [search, setSearch] = useUrlSearch(f);
  // The expanded entry is in the URL: «посмотри эту запись» is one link.
  const open = f.num("row") ?? null;
  const page = f.num("page") ?? 1;
  const filters: AuditFilters = {
    q: f.get("q"),
    organizationId: f.get("org"),
    section: f.get("section"),
    action: f.get("action"),
    dateFrom: f.get("from"),
    dateTo: f.get("to"),
    operatorsOnly: f.flag("team") || undefined,
  };
  const audit = useAudit(filters, page);

  const rows = audit.data?.rows ?? [];

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Аудит действий" subtitle="кто, что и когда изменил — по всем организациям и в самой команде" />
      <div className="flex flex-wrap items-center gap-2">
        <SearchInput placeholder="Объект, имя, детали" value={search} onChange={setSearch} />
        <FilterSelect
          label="Организация"
          allLabel="Все организации"
          searchPlaceholder="Название организации"
          menuWidth={340}
          value={filters.organizationId}
          onChange={(v) => f.set({ org: v })}
          options={[{ value: "none", label: "Команда Bilimtrack", icon: "shield-lock" }, ...orgs.map((o) => ({ value: String(o.id), label: o.name }))]}
        />
        <FilterSelect label="Раздел" allLabel="Все разделы" value={filters.section} onChange={(v) => f.set({ section: v })} options={choices.data?.sections ?? []} />
        <FilterSelect label="Действие" allLabel="Все действия" value={filters.action} onChange={(v) => f.set({ action: v })} options={choices.data?.actions ?? []} />
        <PeriodFilter from={filters.dateFrom} to={filters.dateTo} onChange={(r) => f.set({ from: r.from, to: r.to })} />
        <FilterChip icon="shield-lock" tone={filters.operatorsOnly ? "active" : "default"} label="Только команда Bilimtrack" onClick={() => f.set({ team: !filters.operatorsOnly })} />
        <FilterReset filters={f} keys={["q", "org", "section", "action", "from", "to", "team"]} />
        <ExportButton
          filename="audit"
          head={["Время", "Кто", "Роль", "Организация", "Объект", "Действие", "Раздел", "Детали", "IP", "Изменения"]}
          load={() => exportAudit(filters)}
          row={(a) => [
            formatDateTimeFull(a.createdAt),
            a.actor.fullName || "Система",
            a.actor.role,
            a.organization?.name ?? "Команда / платформа",
            a.objectRepr,
            a.actionLabel,
            a.sectionLabel,
            a.details,
            a.actorIp,
            diffRows(a).map((d) => `${d.field}: ${d.was} → ${d.now}`).join("; "),
          ]}
        />
      </div>

      {audit.error ? (
        <Callout tone="danger" icon="alert-triangle">
          Журнал не загрузился: {audit.error.message}
        </Callout>
      ) : (
        <div className="overflow-auto rounded-xl border border-neutral-200">
          <div className="grid min-w-[1080px] gap-3 border-b border-neutral-200 bg-neutral-50 px-3.5 py-[9px] text-[11px] font-semibold text-neutral-500" style={{ gridTemplateColumns: COLS }}>
            {["", "Время", "Кто", "Организация", "Объект", "Действие", "Раздел"].map((h, i) => (
              <span key={i}>{h}</span>
            ))}
          </div>
          {audit.isLoading && <div className="h-40 animate-pulse bg-neutral-50" />}
          {!audit.isLoading && !rows.length && <EmptyState icon="history" title="Записей нет" description="Измените фильтры или период." />}
          {rows.map((a) => {
            const isOpen = open === a.id;
            const diff = diffRows(a);
            return (
              <div key={a.id} className="border-b border-neutral-100 last:border-b-0">
                <div
                  onClick={() => f.set({ row: isOpen ? undefined : a.id, page: f.get("page") })}
                  className="grid min-w-[1080px] cursor-pointer items-center gap-3 px-3.5 py-2.5 text-[13px] hover:bg-neutral-50"
                  style={{ gridTemplateColumns: COLS }}
                >
                  <Icon name={isOpen ? "chevron-down" : "chevron-right"} size={16} className="text-neutral-400" />
                  <span className="text-xs text-neutral-500">{formatDateTimeShort(a.createdAt)}</span>
                  <span className="min-w-0">
                    <Cell className="block">{a.actor.fullName || "Система"}</Cell>
                    {a.actor.role && <Cell className="block text-[11px] text-neutral-400">{a.actor.role}</Cell>}
                  </span>
                  {a.organization ? (
                    <Link to={routes.org(a.organization.id)} onClick={(e) => e.stopPropagation()} className="min-w-0 truncate text-xs">
                      {a.organization.name}
                    </Link>
                  ) : (
                    <span className="text-xs text-neutral-400">Команда / платформа</span>
                  )}
                  <Cell title={a.objectRepr}>{a.objectRepr || "—"}</Cell>
                  <span>
                    <Pill size="sm" tone={ACTION_TONE[a.action] ?? "neutral"}>
                      {a.actionLabel}
                    </Pill>
                  </span>
                  <span className="text-xs text-neutral-500">{a.sectionLabel}</span>
                </div>
                {isOpen && (
                  <div className="border-t border-neutral-100 bg-neutral-50 py-3.5 pr-3.5 pl-[50px]">
                    <div className="mb-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-neutral-500">
                      {a.details && <span>{a.details}</span>}
                      {a.actorIp && <span className="font-num">IP {a.actorIp}</span>}
                    </div>
                    {diff.length ? (
                      <>
                        <div className="grid grid-cols-[220px_minmax(0,1fr)_minmax(0,1fr)] gap-3 pb-1.5 text-[11px] font-semibold text-neutral-400">
                          <span>Поле</span>
                          <span>Было</span>
                          <span>Стало</span>
                        </div>
                        {diff.map((d) => (
                          <div key={d.field} className="grid grid-cols-[220px_minmax(0,1fr)_minmax(0,1fr)] items-center gap-3 border-t border-[var(--color-neutral-100)] py-[7px] text-[13px]">
                            <span className="font-num text-xs text-neutral-500">{d.field}</span>
                            <span className="justify-self-start rounded-lg bg-red-50 px-2.5 py-[3px] break-all text-red-600">{d.was}</span>
                            <span className="justify-self-start rounded-lg bg-green-50 px-2.5 py-[3px] break-all text-green-600">{d.now}</span>
                          </div>
                        ))}
                      </>
                    ) : (
                      <div className="text-xs text-neutral-400">Без деталей изменения.</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      <Pager page={page} pageSize={JOURNAL_PAGE} total={audit.data?.count ?? 0} onPage={(p) => f.set({ page: p })} />
    </div>
  );
}
