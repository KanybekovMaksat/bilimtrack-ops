import { useState } from "react";
import { useNavigate } from "react-router";
import { ERRORS_BY_ORG, ERROR_LEVEL, ERROR_STATE_COLOR, useErrorIssues } from "@/entities/platform";
import { routes } from "@/shared/config";
import { cn } from "@/shared/lib";
import { Button, Card, Cell, Icon, Meter, Num, PageHeader, Row, StatusDot, Table } from "@/shared/ui";

export function ErrorsPage() {
  const issues = useErrorIssues();
  const navigate = useNavigate();
  const [org, setOrg] = useState<string | null>(null);
  /** Dev tasks created from this screen: issue id → task key. */
  const [created, setCreated] = useState<Record<number, string>>({});

  const withLinks = issues.map((i) => (i.link ? i : created[i.id] ? { ...i, link: created[i.id], linkKind: "task" as const } : i));
  const rows = withLinks.filter((i) => !org || i.orgs.includes(org));
  const unlinked = withLinks.filter((i) => !i.link && i.state !== "Решена").length;
  const max = ERRORS_BY_ORG[0].n;

  const kpi = [
    { l: "События за 24 часа", n: "1 284", c: "#0a0a0a", d: "▲ 18%", dc: "#e7000b" },
    { l: "Затронуто пользователей", n: "312", c: "#0a0a0a", d: "▲ 41", dc: "#e7000b" },
    { l: "Новые ошибки", n: "3", c: "#fb2c36", d: "за сутки", dc: "#a1a1a1" },
    { l: "Без задачи и тикета", n: String(unlinked), c: "#0a0a0a", d: "требуют разбора", dc: "#a1a1a1" },
  ];

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Ошибки"
        subtitle="данные Sentry с разбивкой по учреждениям · обновлено 2 мин назад"
        actions={<Button icon="external-link">Открыть в Sentry</Button>}
      />
      <div className="grid grid-cols-4 gap-3">
        {kpi.map((k) => (
          <Card key={k.l} className="flex flex-col gap-[3px] px-4 py-3.5">
            <div className="text-xs text-neutral-500">{k.l}</div>
            <div className="flex items-baseline gap-2">
              <span className="font-num text-2xl leading-[30px] font-semibold" style={{ color: k.c }}>
                {k.n}
              </span>
              <span className="text-xs font-medium" style={{ color: k.dc }}>
                {k.d}
              </span>
            </div>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-[300px_minmax(0,1fr)] items-start gap-4">
        <Card className="overflow-hidden">
          <div className="flex items-baseline justify-between border-b border-neutral-100 px-4 py-[13px]">
            <span className="text-sm font-medium">По учреждениям · 24 ч</span>
            {org && (
              <button onClick={() => setOrg(null)} className="border-0 bg-transparent p-0 text-xs text-brand">
                Сбросить
              </button>
            )}
          </div>
          {ERRORS_BY_ORG.map((o) => {
            const on = org === o.org;
            return (
              <button
                key={o.org}
                onClick={() => setOrg(on ? null : o.org)}
                className={cn("flex w-full flex-col gap-[5px] border-0 px-4 py-[9px] text-left", on ? "bg-brand-50" : "bg-transparent hover:bg-neutral-50")}
              >
                <div className="flex w-full justify-between text-[13px]">
                  <span className={on ? "font-semibold text-brand" : ""}>{o.org}</span>
                  <span className="font-num text-xs text-neutral-600">{o.n}</span>
                </div>
                <Meter className="w-full" value={Math.round((o.n / max) * 100)} color={on ? "#155dfc" : "#d4d4d4"} />
              </button>
            );
          })}
        </Card>
        <Table
          cols="minmax(280px,1fr) 76px 170px 70px 70px 110px 100px 110px"
          minWidth={1030}
          head={["Ошибка", "Уровень", "Учреждения", "События", "Польз.", "Последняя", "Статус", "Связь"]}
        >
          {rows.map((i) => {
            const lv = ERROR_LEVEL[i.level];
            return (
              <Row key={i.id}>
                <span className="min-w-0">
                  <Cell className="block font-medium">{i.title}</Cell>
                  <span className="block font-num text-[11px] text-neutral-400">
                    {i.culprit} · впервые {i.first}
                  </span>
                </span>
                <span>
                  <span className="rounded-full px-2 py-0.5 text-[11px] font-semibold" style={{ background: lv.bg, color: lv.fg }}>
                    {lv.label}
                  </span>
                </span>
                <span className="flex flex-wrap gap-1">
                  {i.orgs.map((o) => (
                    <span key={o} className="flex h-5 items-center rounded-md bg-neutral-100 px-1.5 text-[11px] font-medium text-neutral-600">
                      {o}
                    </span>
                  ))}
                </span>
                <Num>{i.events}</Num>
                <Num className="text-neutral-500">{i.users}</Num>
                <span className="text-xs text-neutral-500">{i.last}</span>
                <StatusDot color={ERROR_STATE_COLOR[i.state]}>{i.state}</StatusDot>
                <span>
                  {i.link ? (
                    <button
                      onClick={() => navigate(i.linkKind === "ticket" ? routes.ticket(i.link) : routes.tasks)}
                      className="inline-flex items-center gap-[5px] border-0 bg-transparent p-0 font-num text-xs text-brand"
                    >
                      <Icon name={i.linkKind === "ticket" ? "lifebuoy" : "git-pull-request"} size={14} />
                      {i.link}
                    </button>
                  ) : (
                    <button
                      onClick={() => setCreated((c) => ({ ...c, [i.id]: `DEV-${419 + Object.keys(c).length}` }))}
                      className="inline-flex items-center gap-1 border-0 bg-transparent p-0 text-xs text-neutral-500 hover:text-brand"
                    >
                      <Icon name="plus" size={13} />
                      Задача
                    </button>
                  )}
                </span>
              </Row>
            );
          })}
        </Table>
      </div>
    </div>
  );
}
