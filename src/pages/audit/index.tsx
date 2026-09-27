import { useEffect, useState } from "react";
import { Link } from "react-router";
import { JOURNAL_PAGE, diffRows, useAudit, useJournalChoices, type AuditFilters } from "@/entities/journal";
import { useOrganizationsSoft } from "@/entities/organization";
import { routes } from "@/shared/config";
import { formatDateTimeShort } from "@/shared/lib";
import { Callout, Cell, EmptyState, FilterChip, Icon, PageHeader, Pager, Pill, SearchInput, SelectInput, TextInput } from "@/shared/ui";

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
  const [filters, setFilters] = useState<AuditFilters>({});
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState<number | null>(null);
  const audit = useAudit(filters, page);

  const update = (patch: Partial<AuditFilters>) => {
    setFilters((f) => ({ ...f, ...patch }));
    setPage(1);
  };
  useEffect(() => {
    const t = setTimeout(() => {
      if ((filters.q ?? "") !== search.trim()) update({ q: search.trim() || undefined });
    }, 350);
    return () => clearTimeout(t);
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  const rows = audit.data?.rows ?? [];

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Аудит действий" subtitle="кто, что и когда изменил — по всем организациям и в самой команде" />
      <div className="flex flex-wrap items-center gap-2">
        <SearchInput placeholder="Объект, имя, детали" value={search} onChange={setSearch} />
        <SelectInput
          className="w-[210px]"
          placeholder="Все организации"
          value={filters.organizationId ?? ""}
          onChange={(e) => update({ organizationId: e.target.value || undefined })}
          options={[{ value: "none", label: "— Команда Bilimtrack" }, ...orgs.map((o) => ({ value: String(o.id), label: o.name }))]}
        />
        <SelectInput
          className="w-[170px]"
          placeholder="Все разделы"
          value={filters.section ?? ""}
          onChange={(e) => update({ section: e.target.value || undefined })}
          options={choices.data?.sections ?? []}
        />
        <SelectInput
          className="w-[180px]"
          placeholder="Все действия"
          value={filters.action ?? ""}
          onChange={(e) => update({ action: e.target.value || undefined })}
          options={choices.data?.actions ?? []}
        />
        <TextInput look="plain" inputSize="sm" type="date" className="w-[150px]" value={filters.dateFrom ?? ""} onChange={(e) => update({ dateFrom: e.target.value || undefined })} title="С даты" />
        <TextInput look="plain" inputSize="sm" type="date" className="w-[150px]" value={filters.dateTo ?? ""} onChange={(e) => update({ dateTo: e.target.value || undefined })} title="По дату" />
        <FilterChip icon="shield-lock" tone={filters.operatorsOnly ? "active" : "default"} label="Только команда Bilimtrack" onClick={() => update({ operatorsOnly: !filters.operatorsOnly })} />
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
                  onClick={() => setOpen(isOpen ? null : a.id)}
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
                          <div key={d.field} className="grid grid-cols-[220px_minmax(0,1fr)_minmax(0,1fr)] items-center gap-3 border-t border-[#f0f0f0] py-[7px] text-[13px]">
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
      <Pager page={page} pageSize={JOURNAL_PAGE} total={audit.data?.count ?? 0} onPage={setPage} />
    </div>
  );
}
