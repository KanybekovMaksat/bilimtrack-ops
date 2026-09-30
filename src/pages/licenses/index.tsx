import { useState } from "react";
import { useNavigate } from "react-router";
import { LICENSE_CELL, licenseCell, useLicenseCatalog, useLicenses, type LicenseCell, type LicenseRow } from "@/entities/license";
import { EditLicenseModal } from "@/features/edit-license";
import { routes } from "@/shared/config";
import { cn, daysSince, formatDate, orgShort, plural, sortRows, useUrlFilters, useUrlSearch } from "@/shared/lib";
import { Button, Card, Cell, EmptyState, FilterChip, FilterReset, FilterSelect, Icon, OrgMark, PageHeader, SearchInput, Table } from "@/shared/ui";

const LEGEND: LicenseCell[] = ["y", "p", "x", "n", "o"];

export function LicensesPage() {
  const catalog = useLicenseCatalog();
  const licenses = useLicenses();
  const navigate = useNavigate();
  const f = useUrlFilters();
  const [query, setQuery] = useUrlSearch(f, 250);
  const plan = f.oneOf("plan", catalog.plans.map((p) => p.code));
  const diffOnly = f.flag("diff");
  const noContract = f.flag("noContract");
  const expiring = f.flag("expiring");
  const [editing, setEditing] = useState<LicenseRow | null>(null);

  const modules = catalog.modules;
  const cols = `minmax(200px,1.3fr) 120px repeat(${modules.length},minmax(58px,1fr)) 96px 64px`;
  const minWidth = 420 + modules.length * 66;
  const totalDiff = licenses.reduce((a, l) => a + l.mismatches.length, 0);
  const withoutContract = licenses.filter((l) => l.licensedModules === null).length;
  // Negative days = still valid for that many days.
  const leftDays = (l: LicenseRow) => (l.validUntil ? -(daysSince(l.validUntil) ?? 0) : null);
  const isExpiring = (l: LicenseRow) => {
    const d = leftDays(l);
    return d !== null && d <= 30;
  };
  const expiringCount = licenses.filter(isExpiring).length;
  const q = query.trim().toLowerCase();
  const sort = f.get("sort");
  const filtered = licenses.filter(
    (l) =>
      (!diffOnly || l.mismatches.length > 0) &&
      (!noContract || l.licensedModules === null) &&
      (!plan || l.plan === plan) &&
      (!expiring || isExpiring(l)) &&
      (!q || `${l.organization.name} ${l.organization.shortName}`.toLowerCase().includes(q)),
  );
  const rows = sortRows(filtered, sort, {
    org: (l) => l.organization.name,
    plan: (l) => l.planLabel,
    until: (l) => l.validUntil,
  });

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Лицензии и модули" subtitle="что записано в договоре и что реально включено у клиента" />
      <div className="flex items-center gap-2 rounded-xl bg-neutral-50 px-3.5 py-[11px] text-xs leading-[18px] text-neutral-600">
        <Icon name="info-circle" size={16} className="text-neutral-400" />
        <span>
          Продукт один для всех: различия между клиентами — это включённые модули. Лицензия — эталон из договора; она не включает модули сама, а расхождения
          подсвечиваются здесь. Включение и выключение — во вкладке «Модули» карточки организации.
        </span>
      </div>
      <div className="grid grid-cols-5 gap-3">
        {catalog.plans.map((p) => (
          <Card
            key={p.code}
            onClick={() => f.set({ plan: plan === p.code ? undefined : p.code })}
            className={cn("flex cursor-pointer flex-col gap-1 px-4 py-3.5 hover:border-brand", plan === p.code && "border-brand bg-brand-50")}
            title="Показать только этот пакет"
          >
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-sm font-medium">{p.label}</span>
              <span className="text-xs text-neutral-400">
                {p.organizationsCount} {plural(p.organizationsCount, ["клиент", "клиента", "клиентов"])}
              </span>
            </div>
            <div className="text-xs leading-[17px] text-neutral-500">{p.description}</div>
          </Card>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <SearchInput width={220} placeholder="Организация" value={query} onChange={setQuery} />
        <FilterSelect
          label="Пакет"
          allLabel="Все пакеты"
          value={plan}
          onChange={(v) => f.set({ plan: v })}
          options={catalog.plans.map((p) => ({ value: p.code, label: p.label, hint: `${p.organizationsCount} ${plural(p.organizationsCount, ["клиент", "клиента", "клиентов"])}` }))}
        />
        <FilterChip icon="arrows-diff" tone={diffOnly ? "warn" : "default"} label={`Расхождения с договором · ${totalDiff}`} onClick={() => f.set({ diff: !diffOnly })} />
        <FilterChip icon="file-text" tone={noContract ? "active" : "default"} label={`Без договора · ${withoutContract}`} onClick={() => f.set({ noContract: !noContract })} />
        <FilterChip icon="clock-exclamation" tone={expiring ? "danger" : "default"} label={`Истекает ≤ 30 дней · ${expiringCount}`} onClick={() => f.set({ expiring: !expiring })} />
        <FilterReset filters={f} keys={["q", "plan", "diff", "noContract", "expiring"]} />
        <div className="flex-1" />
        {LEGEND.map((k) => {
          const c = LICENSE_CELL[k];
          return (
            <span key={k} className="flex items-center gap-1.5 text-xs text-neutral-600">
              <span className="flex size-[22px] items-center justify-center rounded-md" style={{ background: c.bg }}>
                <Icon name={c.icon} size={15} style={{ color: c.color }} />
              </span>
              {c.label}
            </span>
          );
        })}
      </div>
      {rows.length ? (
        <Table
          cols={cols}
          minWidth={minWidth}
          gap={6}
          head={["Организация", "Пакет", ...modules.map((m) => m.name), "Действует до", ""]}
          headAlign={["left", "left", ...modules.map(() => "center" as const), "left", "right"]}
          sortKeys={["org", "plan", ...modules.map(() => undefined), "until"]}
          sort={sort}
          onSort={(s) => f.set({ sort: s })}
        >
          {rows.map((r) => (
            <div
              key={r.organization.id}
              className="grid items-center border-b border-neutral-100 px-3.5 py-[7px] text-[13px] last:border-b-0"
              style={{ gridTemplateColumns: cols, minWidth, gap: 6 }}
            >
              <span className="flex min-w-0 items-center gap-2">
                <OrgMark short={orgShort(r.organization.shortName || r.organization.name)} size={22} />
                <Cell className="font-medium">{r.organization.name}</Cell>
                {r.mismatches.length > 0 && <span className="shrink-0 text-xs font-medium text-warn">{r.mismatches.length}</span>}
              </span>
              <span className={r.planLabel ? "text-xs text-neutral-700" : "text-xs text-neutral-400"}>{r.planLabel ?? "не заведён"}</span>
              {modules.map((m) => {
                const c = LICENSE_CELL[licenseCell(r, m.code)];
                return (
                  <button
                    key={m.code}
                    title={`${m.name}: ${c.label.toLowerCase()}`}
                    onClick={() => navigate(`${routes.org(r.organization.id)}?tab=modules`)}
                    className="flex h-[30px] items-center justify-center rounded-lg border-0 hover:shadow-[inset_0_0_0_1px_var(--color-neutral-300)]"
                    style={{ background: c.bg }}
                  >
                    <Icon name={c.icon} size={17} style={{ color: c.color }} />
                  </button>
                );
              })}
              <span className={cn("text-xs", isExpiring(r) ? "font-medium text-red-600" : "text-neutral-500")} title={isExpiring(r) ? "Договор истекает или истёк" : undefined}>
                {formatDate(r.validUntil)}
              </span>
              <span className="text-right">
                <Button size="xs" variant="ghost" icon="pencil" aria-label="Изменить лицензию" onClick={() => setEditing(r)} />
              </span>
            </div>
          ))}
        </Table>
      ) : (
        <div className="rounded-xl border border-neutral-200">
          <EmptyState icon="toggle-right" title="По фильтрам ничего не найдено" />
        </div>
      )}
      <div className="text-xs text-neutral-400">Клик по ячейке открывает модули организации. Карандаш — записать или изменить договорную лицензию.</div>
      {editing && (
        <EditLicenseModal
          organization={editing.organization}
          current={{
            plan: editing.plan,
            licensedModules: editing.licensedModules,
            enabledModules: editing.enabledModules,
            validFrom: editing.validFrom,
            validUntil: editing.validUntil,
            note: editing.note,
          }}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
