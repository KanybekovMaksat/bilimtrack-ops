import { useNavigate } from "react-router";
import { RISK_LABEL, RISK_SHORT, useOrgActivity, type AnalyticsFilters, type OrgActivity } from "@/entities/analytics";
import { routes } from "@/shared/config";
import { formatAgo, formatDuration, formatInt, formatNumber, formatPercent } from "@/shared/lib";
import { Card, CardHeader, Cell, EmptyState, ErrorNote, Icon, Num, Pill, Row, Table } from "@/shared/ui";
import { ChangeBadge } from "./common";

function RiskPills({ org }: { org: OrgActivity }) {
  if (!org.risk) return <Pill size="sm" tone="success">в норме</Pill>;
  return (
    <span className="flex flex-col items-start gap-0.5">
      {org.riskReasons.map((r) => (
        <span key={r} title={RISK_LABEL[r]}>
          <Pill size="sm" tone={r === "low_adoption" ? "warn" : "danger"}>
            {RISK_SHORT[r]}
          </Pill>
        </span>
      ))}
    </span>
  );
}

/** Every active client with its activity and churn-risk flags; a row opens the organization. */
export function OrgActivityTable({ filters, riskOnly }: { filters: AnalyticsFilters; riskOnly?: boolean }) {
  const q = useOrgActivity(filters, riskOnly);
  const navigate = useNavigate();
  if (q.error) return <ErrorNote error={q.error} prefix="Организации не загрузились" />;
  const rows = q.data ?? [];
  return (
    <Table
      cols="minmax(190px,1.3fr) 76px 56px 96px 96px 72px 104px 96px minmax(150px,1fr)"
      minWidth={1060}
      head={["Организация", "Участники", "DAU", "За 7 дней", "Активны 30 дн.", "Сессии", "Ср. сессия", "Посл. визит", "Риск оттока"]}
      headAlign={["left", "right", "right", "right", "right", "right", "right", "right", "left"]}
    >
      {q.isLoading && <div className="h-40 animate-pulse bg-neutral-50" />}
      {!q.isLoading && !rows.length && <EmptyState icon="building" title={riskOnly ? "Клиентов под риском нет" : "Организаций нет"} />}
      {rows.map((o) => (
        <Row key={o.organization.id} onClick={() => navigate(`${routes.org(o.organization.id)}?tab=activity`)} className={o.risk ? "bg-red-50/40" : undefined}>
          <Cell className="font-medium">{o.organization.name}</Cell>
          <Num className="text-right">{formatInt(o.members)}</Num>
          <Num className="text-right">{formatNumber(o.dau, 1)}</Num>
          <span className="flex items-baseline justify-end gap-1.5">
            <Num>{formatInt(o.users7d)}</Num>
            <ChangeBadge ratio={o.change7d} />
          </span>
          <Num className="text-right">{formatPercent(o.activeShare30d)}</Num>
          <Num className="text-right">{formatInt(o.sessions)}</Num>
          <Num className="text-right">{formatDuration(o.avgSessionSeconds)}</Num>
          <Num className="text-right text-neutral-500">{o.lastSeenAt ? formatAgo(o.lastSeenAt) : "—"}</Num>
          <RiskPills org={o} />
        </Row>
      ))}
    </Table>
  );
}

/** Home-page card: clients that stopped coming in, most urgent first. */
export function RiskOrgsCard() {
  const q = useOrgActivity({}, true);
  const navigate = useNavigate();
  const rows = q.data ?? [];
  return (
    <Card className="overflow-hidden">
      <CardHeader
        className="py-3.5"
        title={
          <span className="flex items-center gap-2">
            <Icon name="alert-triangle" size={16} className="text-red-500" />
            Клиенты под риском оттока
          </span>
        }
        subtitle="по активности в приложении за последние 7 и 30 дней"
        action={rows.length ? <Pill tone="danger">{rows.length}</Pill> : undefined}
      />
      {q.error && <ErrorNote className="m-4" error={q.error} />}
      {q.isLoading && <div className="m-4 h-24 animate-pulse rounded-xl bg-neutral-50" />}
      {!q.isLoading && !q.error && !rows.length && <div className="px-4 py-6 text-center text-[13px] text-neutral-400">Все клиенты заходят как обычно</div>}
      {rows.slice(0, 6).map((o) => (
        <div
          key={o.organization.id}
          onClick={() => navigate(`${routes.org(o.organization.id)}?tab=activity`)}
          className="flex cursor-pointer items-center gap-3 border-b border-neutral-50 px-4 py-2.5 last:border-b-0 hover:bg-neutral-50"
        >
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] leading-[17px]">{o.organization.name}</div>
            <div className="truncate text-[11px] text-neutral-400">{o.riskReasons.map((r) => RISK_LABEL[r]).join(" · ")}</div>
          </div>
          <div className="text-right text-[11px] whitespace-nowrap text-neutral-500">
            <div className="font-num">
              {formatInt(o.users7d)} / {formatInt(o.members)}
            </div>
            <div>за 7 дней</div>
          </div>
        </div>
      ))}
    </Card>
  );
}
