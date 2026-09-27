import { useState } from "react";
import { useAuditLog } from "@/entities/platform";
import { Cell, FilterChip, Icon, OrgLabel, PageHeader } from "@/shared/ui";

const COLS = "24px 130px 150px 150px minmax(200px,1fr) 190px";

export function AuditPage() {
  const entries = useAuditLog();
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Аудит действий" subtitle="кто, что и когда изменил — по всем организациям" />
      <div className="flex gap-2">
        {["Период", "Организация", "Сотрудник", "Тип объекта"].map((f) => (
          <FilterChip key={f} label={f} />
        ))}
      </div>
      <div className="overflow-auto rounded-xl border border-neutral-200">
        <div className="grid min-w-[980px] gap-3 border-b border-neutral-200 bg-neutral-50 px-3.5 py-[9px] text-[11px] font-semibold text-neutral-500" style={{ gridTemplateColumns: COLS }}>
          {["", "Время", "Сотрудник", "Организация", "Объект", "Действие"].map((h) => (
            <span key={h}>{h}</span>
          ))}
        </div>
        {entries.map((a) => {
          const isOpen = open === a.id;
          return (
            <div key={a.id} className="border-b border-neutral-100 last:border-b-0">
              <div
                onClick={() => setOpen(isOpen ? null : a.id)}
                className="grid min-w-[980px] cursor-pointer items-center gap-3 px-3.5 py-2.5 text-[13px] hover:bg-neutral-50"
                style={{ gridTemplateColumns: COLS }}
              >
                <Icon name={isOpen ? "chevron-down" : "chevron-right"} size={16} className="text-neutral-400" />
                <span className="text-xs text-neutral-500">{a.time}</span>
                <span className="text-brand">{a.who}</span>
                <OrgLabel short={a.orgShort} name={a.org} className="text-xs" />
                <Cell>{a.object}</Cell>
                <span className="text-xs text-neutral-700">{a.action}</span>
              </div>
              {isOpen && (
                <div className="border-t border-neutral-100 bg-neutral-50 py-3.5 pr-3.5 pl-[50px]">
                  <div className="grid grid-cols-[220px_minmax(0,1fr)_minmax(0,1fr)] gap-3 pb-1.5 text-[11px] font-semibold text-neutral-400">
                    <span>Поле</span>
                    <span>Было</span>
                    <span>Стало</span>
                  </div>
                  {a.diff.map((d) => (
                    <div key={d.field} className="grid grid-cols-[220px_minmax(0,1fr)_minmax(0,1fr)] items-center gap-3 border-t border-[#f0f0f0] py-[7px] text-[13px]">
                      <span className="text-neutral-500">{d.field}</span>
                      <span className="justify-self-start rounded-lg bg-red-50 px-2.5 py-[3px] text-red-600">{d.was}</span>
                      <span className="justify-self-start rounded-lg bg-green-50 px-2.5 py-[3px] text-green-600">{d.now}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <p className="m-0 text-xs text-neutral-400">Строка раскрывается в детали изменения: поле, было, стало.</p>
    </div>
  );
}
