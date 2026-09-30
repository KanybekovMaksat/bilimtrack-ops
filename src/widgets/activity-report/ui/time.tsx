import { WEEKDAYS, useAnalyticsHeatmap, type AnalyticsFilters, type Heatmap } from "@/entities/analytics";
import { formatInt, plural } from "@/shared/lib";
import { ColumnChart, HeatGrid } from "@/shared/ui";
import { ReportCard } from "./common";

const HOURS = Array.from({ length: 24 }, (_, h) => h);
const hourLabel = (h: number) => `${String(h).padStart(2, "0")}:00`;
const sessionsText = (n: number) => `${formatInt(n)} ${plural(n, ["сессия", "сессии", "сессий"])}`;

function matrix(h: Heatmap) {
  const values = WEEKDAYS.map(() => HOURS.map(() => 0));
  for (const c of h.cells) values[c.weekday - 1][c.hour] = c.sessions;
  return values;
}

/** When people come in: weekday × hour grid (platform time, Asia/Bishkek) and the hourly profile. */
export function TimeReport({ filters }: { filters: AnalyticsFilters }) {
  const q = useAnalyticsHeatmap(filters);
  const peak = q.data?.peak;
  return (
    <div className="flex flex-col gap-4">
      <ReportCard
        title="Во сколько заходят"
        subtitle={peak ? `пик — ${WEEKDAYS[peak.weekday - 1]}, ${hourLabel(peak.hour)}–${hourLabel((peak.hour + 1) % 24)} · время Бишкека` : "время Бишкека, по началу сессии"}
        query={q}
        height={230}
      >
        {(h) => (
          <HeatGrid
            rowLabels={WEEKDAYS}
            colLabels={HOURS.map((x) => (x % 3 === 0 ? String(x) : ""))}
            values={matrix(h)}
            title={(v, row, col) => `${WEEKDAYS[row]}, ${hourLabel(col)}: ${sessionsText(v)}`}
          />
        )}
      </ReportCard>
      <div className="grid grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] items-start gap-4">
        <ReportCard title="По часам" subtitle="сессии за период по часу начала" query={q}>
          {(h) => (
            <ColumnChart
              values={h.byHour}
              labels={HOURS.map((x) => (x % 3 === 0 ? String(x) : ""))}
              title={(v, i) => `${hourLabel(i)}: ${sessionsText(v)}`}
              highlight={h.byHour.indexOf(Math.max(...h.byHour))}
            />
          )}
        </ReportCard>
        <ReportCard title="По дням недели" query={q}>
          {(h) => (
            <ColumnChart
              values={h.byWeekday}
              labels={WEEKDAYS}
              title={(v, i) => `${WEEKDAYS[i]}: ${sessionsText(v)}`}
              highlight={h.byWeekday.indexOf(Math.max(...h.byWeekday))}
            />
          )}
        </ReportCard>
      </div>
    </div>
  );
}
