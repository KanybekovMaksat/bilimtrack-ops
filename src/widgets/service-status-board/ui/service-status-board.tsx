import { ServiceStatusIndicator, useServices } from "@/entities/service";
import { cn, formatRelative } from "@/shared/lib";
import { EmptyState, Spinner } from "@/shared/ui";

export function ServiceStatusBoard({ compact = false }: { compact?: boolean }) {
  const { data: services, isPending, isError } = useServices();

  if (isPending) return <Spinner />;
  if (isError) return <EmptyState title="Не удалось получить статус сервисов" />;

  return (
    <ul className="divide-y divide-line">
      {services.map((s) => (
        <li key={s.id} className="flex flex-wrap items-center gap-x-6 gap-y-1 px-5 py-3">
          <div className="min-w-0 flex-1">
            <p className="font-medium">{s.name}</p>
            {!compact && <p className="text-sm text-fg-muted">{s.description} · {s.host}</p>}
          </div>
          {!compact && (
            <>
              <span className="w-24 text-sm text-fg-muted tabular-nums">{s.latencyMs} мс</span>
              <span className={cn("w-20 text-sm tabular-nums", s.uptime < 99.5 ? "text-warning" : "text-fg-muted")}>
                {s.uptime.toFixed(2)}%
              </span>
              <span className="w-28 text-sm text-fg-subtle">{formatRelative(s.checkedAt)}</span>
            </>
          )}
          <span className="w-28"><ServiceStatusIndicator status={s.status} /></span>
        </li>
      ))}
    </ul>
  );
}
