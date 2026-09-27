import { useState } from "react";
import { useNavigate } from "react-router";
import { LICENSE_CELL, LICENSE_MODULES, LICENSE_PACKS, licenseDiff, useLicenses, type LicenseCell } from "@/entities/license";
import { routes } from "@/shared/config";
import { Card, Cell, FilterChip, Icon, OrgMark, PageHeader, SearchInput, Table } from "@/shared/ui";

const COLS = "minmax(170px,1.2fr) 108px repeat(8,minmax(78px,1fr)) 84px";

export function LicensesPage() {
  const licenses = useLicenses();
  const navigate = useNavigate();
  const [diffOnly, setDiffOnly] = useState(false);
  const [query, setQuery] = useState("");
  const totalDiff = licenses.reduce((a, l) => a + licenseDiff(l), 0);
  const rows = licenses.filter((l) => (!diffOnly || licenseDiff(l) > 0) && l.name.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Лицензии и модули" subtitle="что включено у каждого клиента и что записано в договоре" />
      <div className="flex items-center gap-2 rounded-xl bg-neutral-50 px-3.5 py-[11px] text-xs leading-[18px] text-neutral-600">
        <Icon name="info-circle" size={16} className="text-neutral-400" />
        <span>
          Продукт один для всех. Различия между клиентами — это настройки модулей, а не отдельные версии. Эталон для каждого учреждения — таблица функциональности из приложения к договору.
        </span>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {LICENSE_PACKS.map((p) => (
          <Card key={p.name} className="flex flex-col gap-1 px-4 py-3.5">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-sm font-medium">{p.name}</span>
              <span className="text-xs text-neutral-400">{p.count}</span>
            </div>
            <div className="text-xs leading-[17px] text-neutral-500">{p.modules}</div>
          </Card>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <SearchInput width={220} placeholder="Организация" value={query} onChange={setQuery} />
        <FilterChip icon="arrows-diff" tone={diffOnly ? "warn" : "default"} label={`Только расхождения с договором · ${totalDiff}`} onClick={() => setDiffOnly((v) => !v)} />
        <div className="flex-1" />
        {(["y", "p", "x", "n"] as LicenseCell[]).map((k) => {
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
      <Table
        cols={COLS}
        minWidth={1160}
        gap={8}
        head={["Организация", "Пакет договора", ...LICENSE_MODULES, "Расхождения"]}
        headAlign={["left", "left", ...LICENSE_MODULES.map(() => "center" as const), "right"]}
      >
        {rows.map((r) => {
          const diff = licenseDiff(r);
          return (
            <div key={r.name} className="grid items-center border-b border-neutral-100 px-3.5 py-[7px] text-[13px] last:border-b-0" style={{ gridTemplateColumns: COLS, minWidth: 1160, gap: 8 }}>
              <span className="flex min-w-0 items-center gap-2">
                <OrgMark short={r.short} size={22} />
                <Cell className="font-medium">{r.name}</Cell>
              </span>
              <span className="text-xs text-neutral-700">{r.pack}</span>
              {r.cells.map((k, i) => {
                const c = LICENSE_CELL[k];
                return (
                  <button
                    key={i}
                    title={`${LICENSE_MODULES[i]}: ${c.label.toLowerCase()}`}
                    onClick={() => navigate(`${routes.org(r.slug)}?tab=modules`)}
                    className="flex h-[30px] items-center justify-center rounded-lg border-0 hover:shadow-[inset_0_0_0_1px_#d4d4d4]"
                    style={{ background: c.bg }}
                  >
                    <Icon name={c.icon} size={17} style={{ color: c.color }} />
                  </button>
                );
              })}
              <span className="text-right text-xs font-medium text-warn">{diff || ""}</span>
            </div>
          );
        })}
      </Table>
      <div className="text-xs text-neutral-400">Клик по ячейке открывает вкладку «Модули» организации — включение и выключение там, с подтверждением последствий.</div>
    </div>
  );
}
