import { DEVICE_LABEL, PORTAL_LABEL, pageName, useUserActivity, type Device } from "@/entities/analytics";
import { formatDateTimeShort, formatDuration, formatInt, plural } from "@/shared/lib";
import { BarList, Card, CardHeader, ColumnChart, ErrorNote, KV } from "@/shared/ui";

const HOURS = Array.from({ length: 24 }, (_, h) => h);

/** One person's last 30 days in the client app: for support («заходил ли он вообще?»). */
export function UserActivityCard({ userId }: { userId: number }) {
  const q = useUserActivity(userId);
  const a = q.data;
  return (
    <Card className="overflow-hidden">
      <CardHeader title="Активность в приложении" subtitle="последние 30 дней · только активное время" />
      <div className="p-4">
        {q.error && <ErrorNote error={q.error} prefix="Активность не загрузилась" />}
        {!a && !q.error && <div className="h-40 animate-pulse rounded-xl bg-neutral-50" />}
        {a && !a.firstSeenAt && <div className="py-4 text-center text-[13px] text-neutral-400">Трекер ещё ни разу не видел этого пользователя в приложении</div>}
        {a && a.firstSeenAt && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
              <KV k="Последний визит" width={150}>
                {formatDateTimeShort(a.lastSeenAt)}
              </KV>
              <KV k="Первый визит" width={150}>
                {formatDateTimeShort(a.firstSeenAt)}
              </KV>
              <KV k="Сессий" width={150}>
                {formatInt(a.sessions)} · {formatInt(a.activeDays)} {plural(a.activeDays, ["день", "дня", "дней"])} с визитами
              </KV>
              <KV k="Активное время" width={150}>
                {formatDuration(a.totalActiveSeconds)}
              </KV>
              <KV k="Средняя сессия" width={150}>
                {formatDuration(a.avgSessionSeconds)}
              </KV>
              <KV k="Медианная сессия" width={150}>
                {formatDuration(a.medianSessionSeconds)}
              </KV>
            </div>
            <div className="grid grid-cols-2 items-start gap-6">
              <div>
                <div className="mb-2 text-xs font-semibold text-neutral-500">Где проводит время</div>
                {a.topPages.length ? (
                  <BarList rows={a.topPages.map((p) => ({ key: p.path, label: pageName(p.path) ?? p.path, value: p.totalSeconds, hint: `${formatInt(p.views)} просм.` }))} format={formatDuration} />
                ) : (
                  <div className="text-[13px] text-neutral-400">—</div>
                )}
              </div>
              <div>
                <div className="mb-2 text-xs font-semibold text-neutral-500">Во сколько заходит</div>
                <ColumnChart height={90} values={a.byHour} labels={HOURS.map((h) => (h % 6 === 0 ? String(h) : ""))} title={(v, h) => `${String(h).padStart(2, "0")}:00 — ${v}`} />
                {!!a.features.length && (
                  <div className="mt-3 text-xs text-neutral-500">
                    Действия: {a.features.map((f) => `${f.label} — ${formatInt(f.events)}`).join(" · ")}
                  </div>
                )}
              </div>
            </div>
            <div>
              <div className="mb-1.5 text-xs font-semibold text-neutral-500">Последние сессии</div>
              {a.recentSessions.map((s) => (
                <div key={s.id} className="grid grid-cols-[130px_110px_minmax(0,1fr)_150px_minmax(0,1fr)] gap-3 border-b border-neutral-50 py-1.5 text-xs last:border-b-0">
                  <span className="text-neutral-500">{formatDateTimeShort(s.startedAt)}</span>
                  <span className="font-num">{formatDuration(s.activeSeconds)}</span>
                  <span className="truncate">
                    {pageName(s.entryPath) ?? `${PORTAL_LABEL[s.portal] ?? s.portal} · ${s.entryPath}`} · {s.pageViews} стр.
                  </span>
                  <span className="truncate text-neutral-500">{[DEVICE_LABEL[s.deviceType as Device] ?? s.deviceType, s.browser, s.os].filter(Boolean).join(" · ")}</span>
                  <span className="truncate text-neutral-400">{s.organization?.name ?? ""}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
