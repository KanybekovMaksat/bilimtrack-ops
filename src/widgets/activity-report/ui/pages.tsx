import { DEVICE_LABEL, pageName, useAnalyticsBreakdown, useAnalyticsPages, type AnalyticsFilters, type BreakdownRow, type Device } from "@/entities/analytics";
import { formatDuration, formatInt, formatPercent } from "@/shared/lib";
import { BarList, Cell, EmptyState, ErrorNote, Num, Row, Table } from "@/shared/ui";
import { ReportCard } from "./common";

/** Pages of the client app: views, people, active time, entry and exit counts. */
export function PagesTable({ filters, limit }: { filters: AnalyticsFilters; limit?: number }) {
  const q = useAnalyticsPages(filters);
  if (q.error) return <ErrorNote error={q.error} prefix="Страницы не загрузились" />;
  const rows = (q.data ?? []).slice(0, limit);
  return (
    <Table
      cols="minmax(260px,1.6fr) 90px 90px 110px 120px 80px 80px 80px"
      minWidth={1000}
      head={["Страница", "Просмотры", "Люди", "Время / просм.", "Время всего", "Входы", "Выходы", "Доля выходов"]}
      headAlign={["left", "right", "right", "right", "right", "right", "right", "right"]}
    >
      {q.isLoading && <div className="h-40 animate-pulse bg-neutral-50" />}
      {!q.isLoading && !rows.length && <EmptyState icon="article" title="Просмотров нет" description="За период никто не открывал страниц с этими фильтрами." />}
      {rows.map((p) => (
        <Row key={p.path}>
          <span className="min-w-0">
            <Cell className="block">{pageName(p.path) ?? p.path}</Cell>
            {pageName(p.path) && <Cell className="block font-num text-[11px] text-neutral-400">{p.path}</Cell>}
          </span>
          <Num className="text-right">{formatInt(p.views)}</Num>
          <Num className="text-right">{formatInt(p.users)}</Num>
          <Num className="text-right">{formatDuration(p.avgSeconds)}</Num>
          <Num className="text-right">{formatDuration(p.totalSeconds)}</Num>
          <Num className="text-right">{formatInt(p.entries)}</Num>
          <Num className="text-right">{formatInt(p.exits)}</Num>
          <Num className="text-right text-neutral-500">{formatPercent(p.exitRate)}</Num>
        </Row>
      ))}
    </Table>
  );
}

const rowsOf = (rows: BreakdownRow[], label: (r: BreakdownRow) => string) =>
  rows.map((r) => ({ key: r.key || "—", label: label(r), value: r.sessions, hint: `${formatInt(r.users)} чел. · ${formatDuration(r.avgSessionSeconds)}` }));

/** Portals, devices, browsers and OS by sessions. */
export function BreakdownCards({ filters }: { filters: AnalyticsFilters }) {
  const q = useAnalyticsBreakdown(filters);
  const cards = [
    { title: "Порталы", pick: (b: NonNullable<typeof q.data>) => rowsOf(b.portals, (r) => r.label || r.key) },
    { title: "Устройства", pick: (b: NonNullable<typeof q.data>) => rowsOf(b.devices, (r) => DEVICE_LABEL[r.key as Device] ?? (r.key || "Неизвестно")) },
    { title: "Браузеры", pick: (b: NonNullable<typeof q.data>) => rowsOf(b.browsers.slice(0, 6), (r) => r.key || "Неизвестно") },
    { title: "ОС", pick: (b: NonNullable<typeof q.data>) => rowsOf(b.os.slice(0, 6), (r) => r.key || "Неизвестно") },
  ];
  return (
    <div className="grid grid-cols-4 items-start gap-4">
      {cards.map((c) => (
        <ReportCard key={c.title} title={c.title} subtitle="сессии" query={q} height={140}>
          {(b) => {
            const rows = c.pick(b);
            return rows.length ? <BarList rows={rows} format={formatInt} /> : <div className="py-4 text-center text-[13px] text-neutral-400">Нет данных</div>;
          }}
        </ReportCard>
      ))}
    </div>
  );
}
