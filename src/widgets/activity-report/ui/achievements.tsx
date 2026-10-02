import { useAnalyticsAchievements, type AnalyticsFilters } from "@/entities/analytics";
import { formatDayMonth, formatInt, formatPercent } from "@/shared/lib";
import { BarList, Callout, Cell, ColumnChart, ErrorNote, Num, Row, Table } from "@/shared/ui";
import { ReportCard, Tile } from "./common";

/** Achievements: awards in the period, how many learners have any, top badges and schools. */
export function AchievementsReportView({ filters }: { filters: AnalyticsFilters }) {
  const q = useAnalyticsAchievements(filters);
  if (q.error) return <ErrorNote error={q.error} prefix="Отчёт по достижениям не загрузился" />;
  const data = q.data;
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-3">
        <Tile label="Выдано за период" value={data ? formatInt(data.awardsInPeriod) : "…"} sub={data ? `всего ${formatInt(data.awardsTotal)}` : " "} />
        <Tile
          label="Студентов с достижениями"
          value={data ? formatPercent(data.learnersWithAnyShare / 100) : "…"}
          sub={data ? `${formatInt(data.learnersWithAny)} из ${formatInt(data.learnersTotal)} с аккаунтом` : " "}
        />
        <Tile
          label="Без единого достижения"
          value={data ? formatInt(Math.max(0, data.learnersTotal - data.learnersWithAny)) : "…"}
          sub="студентов с аккаунтом"
        />
      </div>

      <ReportCard title="Выдачи по дням" subtitle="сколько достижений получили студенты" query={q} height={180}>
        {(d) => {
          const step = Math.ceil(d.timeline.length / 12);
          return (
            <ColumnChart
              values={d.timeline.map((p) => p.awards)}
              labels={d.timeline.map((p, i) => (i % step === 0 || i === d.timeline.length - 1 ? formatDayMonth(p.date) : ""))}
              title={(v, i) => `${formatDayMonth(d.timeline[i].date)}: ${formatInt(v)}`}
              highlight={d.timeline.length - 1}
            />
          );
        }}
      </ReportCard>

      <div className="grid grid-cols-2 gap-4">
        <ReportCard title="Популярные достижения" subtitle="сколько студентов получили · доля · за период" query={q} height={220}>
          {(d) =>
            d.top.length ? (
              <BarList
                rows={d.top.map((t) => ({
                  key: t.code,
                  label: t.title,
                  value: t.earned,
                  hint: `${formatPercent(t.earnedShare / 100)} · +${formatInt(t.earnedInPeriod)}`,
                }))}
                format={formatInt}
              />
            ) : (
              <div className="py-6 text-center text-[13px] text-neutral-400">Достижений пока никто не получил</div>
            )
          }
        </ReportCard>

        <ReportCard title="По организациям" subtitle="доля студентов хотя бы с одним достижением" query={q} height={220} bodyClassName="p-0">
          {(d) =>
            d.organizations.length ? (
              <Table cols="minmax(160px,1fr) 80px 90px 70px" head={["Организация", "Студентов", "С достиж.", "Доля"]} headAlign={["left", "right", "right", "right"]} className="rounded-none border-0">
                {d.organizations.map((o) => (
                  <Row key={o.organizationId}>
                    <Cell>{o.name}</Cell>
                    <Num className="text-right">{formatInt(o.learners)}</Num>
                    <Num className="text-right">{formatInt(o.withAny)}</Num>
                    <Num className="text-right">{formatPercent(o.share / 100)}</Num>
                  </Row>
                ))}
              </Table>
            ) : (
              <div className="py-6 text-center text-[13px] text-neutral-400">Студентов в выборке нет</div>
            )
          }
        </ReportCard>
      </div>

      <Callout tone="muted" icon="info-circle" iconClassName="text-neutral-400" className="text-neutral-500">
        Фильтры портала и устройства к достижениям не применяются. Студенты с аккаунтом — активные студенты, у которых есть вход в приложение; beta-организации не учитываются, если их не включить.
      </Callout>
    </div>
  );
}
