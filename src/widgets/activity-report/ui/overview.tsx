import { useState } from "react";
import { DURATION_LABEL, change, useAnalyticsOverview, type AnalyticsFilters, type Overview, type SeriesPoint } from "@/entities/analytics";
import { formatDayMonth, formatDuration, formatInt, formatNumber, formatPercent, plural } from "@/shared/lib";
import { BarList, Callout, ColumnChart, ErrorNote, Segmented } from "@/shared/ui";
import { ReportCard, Tile } from "./common";

const perUser = (n: number | null) => (n == null ? "—" : formatNumber(n, 2));

/** The five headline numbers plus reach, with the change against the previous period of the same length. */
export function KpiTiles({ overview }: { overview: Overview }) {
  const { kpis: k, previous: p, reach } = overview;
  const vs = `к прошлым ${overview.days} ${plural(overview.days, ["дню", "дням", "дням"])}`;
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-5 gap-3">
        <Tile label="DAU · в среднем за день" value={formatNumber(k.dau, 1)} change={change(k.dau, p.dau)} sub={vs} />
        <Tile label="Сессии" value={formatInt(k.sessions)} change={change(k.sessions, p.sessions)} sub={`${formatInt(k.pageViews)} просмотров страниц`} />
        <Tile label="Средняя сессия" value={formatDuration(k.avgSessionSeconds)} change={change(k.avgSessionSeconds, p.avgSessionSeconds)} sub="только активное время" />
        <Tile label="Медианная сессия" value={formatDuration(k.medianSessionSeconds)} change={change(k.medianSessionSeconds, p.medianSessionSeconds)} sub="половина сессий короче" />
        <Tile label="Сессий на пользователя" value={perUser(k.sessionsPerUser)} change={change(k.sessionsPerUser, p.sessionsPerUser)} sub="в день, в среднем" />
      </div>
      <div className="grid grid-cols-5 gap-3">
        <Tile label="Уникальных пользователей" value={formatInt(k.uniqueUsers)} change={change(k.uniqueUsers, p.uniqueUsers)} sub={`новых ${formatInt(k.newUsers)} · вернулись ${formatInt(k.returningUsers)}`} />
        <Tile label="WAU / MAU" value={`${formatInt(reach.wau)} / ${formatInt(reach.mau)}`} sub="на последний день периода" />
        <Tile label="Stickiness (DAU / MAU)" value={formatPercent(reach.stickiness)} sub="как часто месячные возвращаются" />
        <Tile label="Отказы" value={formatPercent(k.bounceRate)} change={change(k.bounceRate, p.bounceRate)} lowerIsBetter sub="1 страница и меньше 10 сек" />
        <Tile label="Всего активного времени" value={formatDuration(k.totalActiveSeconds)} change={change(k.totalActiveSeconds, p.totalActiveSeconds)} sub="за период" />
      </div>
    </div>
  );
}

type Metric = "users" | "sessions" | "median" | "total";
const METRICS: { value: Metric; label: string }[] = [
  { value: "users", label: "DAU" },
  { value: "sessions", label: "Сессии" },
  { value: "median", label: "Медиана сессии" },
  { value: "total", label: "Активное время" },
];

const metricValue = (p: SeriesPoint, m: Metric) =>
  m === "users" ? p.users : m === "sessions" ? p.sessions : m === "median" ? (p.medianSessionSeconds ?? 0) : p.totalActiveSeconds;

const metricText = (v: number, m: Metric) => (m === "median" || m === "total" ? formatDuration(v) : formatInt(v));

export function DailyChart({ series }: { series: SeriesPoint[] }) {
  const [metric, setMetric] = useState<Metric>("users");
  const step = Math.ceil(series.length / 12);
  return (
    <div className="flex flex-col gap-2">
      <Segmented size="sm" options={METRICS.map((m) => ({ ...m, label: <span className="px-2.5">{m.label}</span> }))} value={metric} onChange={setMetric} />
      <ColumnChart
        values={series.map((p) => metricValue(p, metric))}
        labels={series.map((p, i) => (i % step === 0 || i === series.length - 1 ? formatDayMonth(p.date) : ""))}
        title={(v, i) => `${formatDayMonth(series[i].date)}: ${metricText(v, metric)}`}
        highlight={series.length - 1}
      />
    </div>
  );
}

export function Durations({ overview }: { overview: Overview }) {
  const total = overview.durations.reduce((a, b) => a + b.sessions, 0);
  if (!total) return <div className="py-6 text-center text-[13px] text-neutral-400">Сессий за период нет</div>;
  return (
    <BarList
      rows={overview.durations.map((b) => ({ key: b.key, label: DURATION_LABEL[b.key] ?? b.key, value: b.sessions, hint: formatPercent(b.sessions / total) }))}
      format={formatInt}
    />
  );
}

/** KPIs, daily chart and session lengths for one set of filters. */
export function ActivityOverview({ filters }: { filters: AnalyticsFilters }) {
  const q = useAnalyticsOverview(filters);
  if (q.error) return <ErrorNote error={q.error} prefix="Сводка не загрузилась" />;
  const overview = q.data;
  return (
    <div className="flex flex-col gap-4">
      {overview ? <KpiTiles overview={overview} /> : <div className="h-[216px] animate-pulse rounded-2xl bg-neutral-50" />}
      {overview && overview.kpis.sessions === 0 && (
        <Callout tone="info" icon="info-circle">
          За этот период сессий нет. Трекер пишет данные с момента выкатки клиентского приложения: сначала они появятся за «Сегодня».
        </Callout>
      )}
      <div className="grid grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] items-start gap-4">
        <ReportCard title="По дням" subtitle="сегодняшний день ещё идёт" query={q} height={200}>
          {(o) => <DailyChart series={o.series} />}
        </ReportCard>
        <ReportCard title="Длительность сессий" subtitle="сколько сессий какой длины" query={q} height={200}>
          {(o) => <Durations overview={o} />}
        </ReportCard>
      </div>
    </div>
  );
}
