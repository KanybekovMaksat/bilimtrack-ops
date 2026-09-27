import { Link, useNavigate } from "react-router";
import { useHomeDashboard } from "@/entities/metrics";
import { useSession } from "@/entities/session";
import { MOCK_TODAY_LABEL, routes } from "@/shared/config";
import { Card, CardHeader, Icon, LineChart, SectionLabel } from "@/shared/ui";
import { toPoints } from "@/shared/lib";

/** Event targets are stored as route keys ("leads", "ticket:ID"). */
const targetPath = (to: string) =>
  to.startsWith("ticket:") ? routes.ticket(to.slice(7)) : (routes[to as keyof typeof routes] as string);

export function HomePage() {
  const data = useHomeDashboard();
  const role = useSession((s) => s.role);
  const navigate = useNavigate();
  const isAdmin = role === "admin";
  const y = (v: number) => 100 - v * 3.4;

  return (
    <div className="flex max-w-[1280px] flex-col gap-[22px]">
      <div className="flex items-baseline gap-3">
        <h1 className="m-0 text-xl leading-[26px] font-semibold tracking-[-.01em]">Главная</h1>
        <span className="text-[13px] text-neutral-400">{MOCK_TODAY_LABEL}</span>
      </div>

      {isAdmin && (
        <div>
          <SectionLabel className="mb-2">Очередь работы</SectionLabel>
          <div className="grid grid-cols-4 gap-3">
            {data.queue.map((q) => (
              <Link
                key={q.label}
                to={targetPath(q.to)}
                className="flex flex-col gap-2.5 rounded-2xl border border-neutral-200 p-4 text-ink hover:border-brand hover:text-ink"
              >
                <div className="flex items-center justify-between">
                  <Icon name={q.icon} size={20} style={{ color: q.color }} />
                  <Icon name="arrow-up-right" size={16} className="text-neutral-300" />
                </div>
                <div className="font-num text-[30px] leading-none font-semibold" style={{ color: q.color }}>
                  {q.n}
                </div>
                <div className="text-[13px] leading-[17px]">{q.label}</div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] items-start gap-4">
        <Card className="overflow-hidden">
          <CardHeader
            className="py-3.5"
            title="Последние события"
            action={
              isAdmin && (
                <Link to={routes.audit} className="text-[13px]">
                  Весь журнал
                </Link>
              )
            }
          />
          {data.events.map((e) => (
            <div
              key={e.text}
              onClick={() => navigate(targetPath(e.to))}
              className="flex cursor-pointer items-center gap-3 border-b border-neutral-50 px-4 py-2.5 last:border-b-0 hover:bg-neutral-50"
            >
              <div className="flex size-7 shrink-0 items-center justify-center rounded-lg" style={{ background: e.tint, color: e.color }}>
                <Icon name={e.icon} size={15} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] leading-[17px]">{e.text}</div>
                <div className="text-[11px] text-neutral-400">{e.org}</div>
              </div>
              <div className="text-[11px] whitespace-nowrap text-neutral-400">{e.time}</div>
            </div>
          ))}
        </Card>

        <div className="flex flex-col gap-4">
          {isAdmin ? (
            <>
              <Card className="p-4">
                <div className="mb-3.5 flex items-center justify-between">
                  <div className="text-sm font-medium">Заявки и тикеты · 30 дней</div>
                  <div className="flex gap-3 text-[11px] text-neutral-500">
                    <span className="flex items-center gap-[5px]">
                      <span className="size-2 rounded-full bg-brand" />
                      Заявки
                    </span>
                    <span className="flex items-center gap-[5px]">
                      <span className="size-2 rounded-full bg-orange-400" />
                      Тикеты
                    </span>
                  </div>
                </div>
                <LineChart
                  width={560}
                  height={130}
                  guides={[10, 55, 100]}
                  series={[
                    { points: toPoints(data.ticketSeries, 560, y), color: "#ff8904" },
                    { points: toPoints(data.leadsSeries, 560, y), color: "#155dfc" },
                  ]}
                />
                <div className="mt-1 flex justify-between text-[10px] text-neutral-400">
                  <span>22 авг</span>
                  <span>5 сен</span>
                  <span>20 сен</span>
                </div>
              </Card>
              <Card className="p-4">
                <div className="mb-3 text-sm font-medium">Сводка по клиентам</div>
                <div className="grid grid-cols-2 gap-3">
                  {data.summary.map((s) => (
                    <div key={s.label} className="rounded-xl bg-neutral-50 px-3 py-2.5">
                      <div className="font-num text-xl leading-[1.2] font-semibold" style={{ color: s.color }}>
                        {s.n}
                      </div>
                      <div className="text-xs text-neutral-500">{s.label}</div>
                    </div>
                  ))}
                </div>
              </Card>
            </>
          ) : (
            <Card className="p-4">
              <div className="mb-1 text-sm font-medium">Мои черновики</div>
              <div className="mb-3 text-xs text-neutral-500">Роль «Контент» не видит очередь работы, графики и сводку по клиентам</div>
              {data.drafts.map((d) => (
                <Link
                  key={d.title}
                  to={routes.postEditor}
                  className="flex items-center gap-2.5 border-t border-neutral-50 py-[9px] text-ink hover:bg-neutral-50 hover:text-ink"
                >
                  <Icon name="file-text" size={16} className="text-neutral-400" />
                  <span className="flex-1 text-[13px]">{d.title}</span>
                  <span className="text-[11px] text-neutral-400">{d.date}</span>
                </Link>
              ))}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
