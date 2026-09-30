import { useAnalyticsFeatures, useAnalyticsRetention, change, type AnalyticsFilters } from "@/entities/analytics";
import { formatDayMonth, formatInt, formatPercent } from "@/shared/lib";
import { BarList, Callout, Card, CardHeader, EmptyState, ErrorNote } from "@/shared/ui";
import { ChangeBadge, ReportCard, Tile } from "./common";

/** Cell tint: the higher the share, the deeper the brand colour. */
const tint = (share: number | null) =>
  share == null ? "transparent" : `color-mix(in oklab, var(--color-brand) ${Math.round(8 + share * 70)}%, white)`;

/** Weekly cohorts by the first session and D1/D7/D30 returns. */
export function RetentionReport({ filters }: { filters: AnalyticsFilters }) {
  const q = useAnalyticsRetention(filters);
  if (q.error) return <ErrorNote error={q.error} prefix="Удержание не загрузилось" />;
  const data = q.data;
  const weeks = data ? Math.max(...data.cohorts.map((c) => c.weeks.length)) : 0;
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-3">
        <Tile label="Вернулись на следующий день (D1)" value={formatPercent(data?.summary.d1)} sub="или позже" />
        <Tile label="Вернулись через неделю (D7)" value={formatPercent(data?.summary.d7)} sub="через 7 дней и позже" />
        <Tile label="Вернулись через месяц (D30)" value={formatPercent(data?.summary.d30)} sub="через 30 дней и позже" />
      </div>
      <Card className="overflow-hidden">
        <CardHeader title="Когорты по неделе первого визита" subtitle="доля когорты, заходившей в каждую следующую неделю · 8 недель до конца периода" />
        {!data ? (
          <div className="m-4 h-[260px] animate-pulse rounded-xl bg-neutral-50" />
        ) : !data.cohorts.some((c) => c.size) ? (
          <EmptyState icon="users" title="Когорт пока нет" description="Удержание появится, когда наберётся хотя бы неделя данных трекера." />
        ) : (
          <div className="overflow-auto p-4">
            <table className="w-full border-separate border-spacing-[3px] text-center text-xs">
              <thead className="text-[11px] text-neutral-500">
                <tr>
                  <th className="text-left font-semibold">Неделя</th>
                  <th className="font-semibold">Людей</th>
                  {Array.from({ length: weeks }, (_, i) => (
                    <th key={i} className="font-semibold">
                      {i === 0 ? "Нед. 0" : `+${i}`}
                    </th>
                  ))}
                  <th className="font-semibold">D1</th>
                  <th className="font-semibold">D7</th>
                  <th className="font-semibold">D30</th>
                </tr>
              </thead>
              <tbody>
                {data.cohorts.map((c) => (
                  <tr key={c.weekStart}>
                    <td className="pr-2 text-left whitespace-nowrap text-neutral-600">с {formatDayMonth(c.weekStart)}</td>
                    <td className="font-num">{formatInt(c.size)}</td>
                    {Array.from({ length: weeks }, (_, i) => {
                      const share = c.size ? (c.weeks[i] ?? null) : null;
                      return (
                        <td key={i} className="rounded-md py-1.5 font-num" style={{ background: tint(share), color: share != null && share > 0.55 ? "white" : undefined }}>
                          {c.weeks[i] === undefined ? "" : c.size ? formatPercent(share) : "—"}
                        </td>
                      );
                    })}
                    <td className="font-num text-neutral-600">{formatPercent(c.d1)}</td>
                    <td className="font-num text-neutral-600">{formatPercent(c.d7)}</td>
                    <td className="font-num text-neutral-600">{formatPercent(c.d30)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      <Callout tone="muted" icon="info-circle" iconClassName="text-neutral-400" className="text-neutral-500">
        Первым визитом считается первая сессия, записанная трекером. Пока трекер работает меньше месяца, все, кто зашёл в первые дни, попадают в первую когорту как «новые».
      </Callout>
    </div>
  );
}

/** Key actions (grades, attendance, messages…) and activation of new users. */
export function FeaturesReport({ filters }: { filters: AnalyticsFilters }) {
  const q = useAnalyticsFeatures(filters);
  if (q.error) return <ErrorNote error={q.error} prefix="Действия не загрузились" />;
  const data = q.data;
  const events = data?.features.reduce((a, f) => a + f.events, 0) ?? 0;
  const before = data?.features.reduce((a, f) => a + f.previousEvents, 0) ?? 0;
  const unused = data ? data.catalog.filter((c) => !data.features.some((f) => f.feature === c.value)) : [];
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-3">
        <Tile label="Ключевых действий" value={data ? formatInt(events) : "…"} change={data ? change(events, before) : undefined} sub="сохранённых на сервере" />
        <Tile
          label="Активация новых"
          value={formatPercent(data?.activation.rate)}
          sub={data ? `${formatInt(data.activation.activated)} из ${formatInt(data.activation.newUsers)} новых сделали действие за первую неделю` : " "}
        />
        <Tile label="Функций без использования" value={data ? formatInt(unused.length) : "…"} sub={unused.map((u) => u.label).join(", ") || "всё используется"} />
      </div>
      <ReportCard title="Какими функциями пользуются" subtitle="действия за период · люди · организации · к прошлому периоду" query={q} height={260}>
        {(d) =>
          d.features.length ? (
            <BarList
              rows={d.features.map((f) => ({
                key: f.feature,
                label: f.label,
                value: f.events,
                hint: (
                  <span className="flex items-baseline gap-2">
                    {formatInt(f.users)} чел. · {formatInt(f.organizations)} орг.
                    <ChangeBadge ratio={change(f.events, f.previousEvents)} />
                  </span>
                ),
              }))}
              format={formatInt}
            />
          ) : (
            <div className="py-6 text-center text-[13px] text-neutral-400">За период ключевых действий не было</div>
          )
        }
      </ReportCard>
    </div>
  );
}
