import { useNavigate } from "react-router";
import { LEAD_STATUSES, useLeads } from "@/entities/lead";
import { routes } from "@/shared/config";
import { PageHeader, Segmented } from "@/shared/ui";

/**
 * The design marks this view as "priority 3 — stage 4": a kanban of the same leads by status.
 * Rendered read-only until drag-and-drop between statuses is designed.
 */
export function FunnelPage() {
  const leads = useLeads();
  const navigate = useNavigate();
  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Воронка по статусам"
        actions={
          <Segmented
            value="funnel"
            onChange={(v) => v === "list" && navigate(routes.leads)}
            options={[
              { value: "list", label: "Список" },
              { value: "funnel", label: "Воронка" },
            ]}
          />
        }
      />
      <div className="grid grid-cols-4 items-start gap-3">
        {LEAD_STATUSES.map((s) => {
          const items = leads.filter((l) => l.status === s);
          return (
            <div key={s} className="flex min-h-[240px] flex-col gap-2.5 rounded-2xl bg-neutral-50 p-3">
              <div className="flex items-center gap-2 px-1">
                <span className="text-[13px] font-semibold">{s}</span>
                <span className="text-[11px] text-neutral-400">{items.length}</span>
              </div>
              {items.map((l) => (
                <div key={l.name} className="flex flex-col gap-1 rounded-xl border border-neutral-200 bg-white p-3">
                  <div className="text-[13px] font-medium">{l.name}</div>
                  <div className="text-xs text-neutral-500">{l.org}</div>
                  <div className="text-[11px] text-neutral-400">
                    {l.date} · {l.source}
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
      <div className="rounded-2xl border border-dashed border-neutral-200 p-6 text-center text-[13px] text-neutral-500">
        Приоритет 3 — этап 4. Альтернативный вид того же списка заявок: колонки по статусам, карточки перетаскиваются.
      </div>
    </div>
  );
}
