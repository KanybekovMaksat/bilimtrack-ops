import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { leadStatusLabel, useLeadsSoft } from "@/entities/lead";
import { useOrganizationsSoft } from "@/entities/organization";
import { SOURCE, formatRelative, isOpen, useTicketsSoft } from "@/entities/ticket";
import { routes } from "@/shared/config";
import { formatInt, toPoints } from "@/shared/lib";
import { Card, CardHeader, Icon, LineChart, SectionLabel } from "@/shared/ui";

const DAY = 86_400_000;

/** Items per day for the last `days` days, oldest first. */
function perDay(dates: string[], days: number, now: number) {
  const start = new Date(now - (days - 1) * DAY).setHours(0, 0, 0, 0);
  const buckets = Array<number>(days).fill(0);
  for (const d of dates) {
    const i = Math.floor((new Date(d).getTime() - start) / DAY);
    if (i >= 0 && i < days) buckets[i]++;
  }
  return buckets;
}

const dayLabel = (ms: number) => new Date(ms).toLocaleDateString("ru-RU", { day: "numeric", month: "short" });

export function HomePage() {
  const tickets = useTicketsSoft().data ?? [];
  const leads = useLeadsSoft().data ?? [];
  const orgs = useOrganizationsSoft().data;
  const summary = orgs
    ? [
        { n: formatInt(orgs.length), label: "Организаций всего", color: "#0a0a0a" },
        { n: formatInt(orgs.filter((o) => o.status === "active").length), label: "Активных", color: "#00a63e" },
        { n: formatInt(orgs.filter((o) => o.status === "inactive").length), label: "На паузе", color: "#fd9a00" },
        { n: formatInt(orgs.reduce((a, o) => a + o.learnersCount, 0)), label: "Учащихся на платформе", color: "#0a0a0a" },
      ]
    : [];
  const navigate = useNavigate();
  const [now] = useState(() => Date.now());

  const queue = [
    { n: leads.filter((l) => l.status === "new").length, label: "Новые заявки на демо", icon: "inbox", color: "#155dfc", to: routes.leads },
    { n: tickets.filter(isOpen).length, label: "Открытые тикеты", icon: "lifebuoy", color: "#0a0a0a", to: routes.tickets },
    { n: tickets.filter((t) => isOpen(t) && t.sla.state === "over").length, label: "Просрочен первый ответ", icon: "clock-exclamation", color: "#fb2c36", to: routes.tickets },
    { n: tickets.filter((t) => t.status === "open" && !t.hasAccount).length, label: "Обращения без аккаунта", icon: "user-search", color: "#fd9a00", to: routes.tickets },
  ];

  const events = [
    ...tickets.map((t) => ({
      at: t.createdAt,
      icon: SOURCE[t.source]?.icon ?? "lifebuoy",
      tint: "#eff6ff",
      color: "#155dfc",
      text: `Тикет ${t.number}: «${t.subject}»`,
      sub: `${t.author} · ${SOURCE[t.source]?.label ?? ""}`,
      to: routes.ticket(t.id),
    })),
    ...leads.map((l) => ({
      at: l.createdAt,
      icon: "inbox",
      tint: "#fff7ed",
      color: "#fd9a00",
      text: `Заявка на демо: ${l.org !== "—" ? l.org : l.name}`,
      sub: `${l.name} · ${leadStatusLabel[l.status]}`,
      to: routes.leads,
    })),
  ]
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 8);

  const leadsSeries = perDay(leads.map((l) => l.createdAt), 30, now);
  const ticketSeries = perDay(tickets.map((t) => t.createdAt), 30, now);
  const max = Math.max(4, ...leadsSeries, ...ticketSeries);
  const y = (v: number) => 100 - (v / max) * 90;

  return (
    <div className="flex max-w-[1280px] flex-col gap-[22px]">
      <div className="flex items-baseline gap-3">
        <h1 className="m-0 text-xl leading-[26px] font-semibold tracking-[-.01em]">Главная</h1>
        <span className="text-[13px] text-neutral-400">{new Date(now).toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long" })}</span>
      </div>

      <div>
        <SectionLabel className="mb-2">Очередь работы</SectionLabel>
        <div className="grid grid-cols-4 gap-3">
          {queue.map((q) => (
            <Link key={q.label} to={q.to} className="flex flex-col gap-2.5 rounded-2xl border border-neutral-200 p-4 text-ink hover:border-brand hover:text-ink">
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

      <div className="grid grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] items-start gap-4">
        <Card className="overflow-hidden">
          <CardHeader className="py-3.5" title="Последние обращения и заявки" />
          {events.length ? (
            events.map((e) => (
              <div
                key={e.text + e.at}
                onClick={() => navigate(e.to)}
                className="flex cursor-pointer items-center gap-3 border-b border-neutral-50 px-4 py-2.5 last:border-b-0 hover:bg-neutral-50"
              >
                <div className="flex size-7 shrink-0 items-center justify-center rounded-lg" style={{ background: e.tint, color: e.color }}>
                  <Icon name={e.icon} size={15} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] leading-[17px]">{e.text}</div>
                  <div className="truncate text-[11px] text-neutral-400">{e.sub}</div>
                </div>
                <div className="text-[11px] whitespace-nowrap text-neutral-400">{formatRelative(e.at, now)}</div>
              </div>
            ))
          ) : (
            <div className="px-4 py-8 text-center text-[13px] text-neutral-400">Пока ничего нет</div>
          )}
        </Card>

        <div className="flex flex-col gap-4">
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
                { points: toPoints(ticketSeries, 560, y), color: "#ff8904" },
                { points: toPoints(leadsSeries, 560, y), color: "#155dfc" },
              ]}
            />
            <div className="mt-1 flex justify-between text-[10px] text-neutral-400">
              <span>{dayLabel(now - 29 * DAY)}</span>
              <span>{dayLabel(now - 15 * DAY)}</span>
              <span>{dayLabel(now)}</span>
            </div>
          </Card>
          <Card className="p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium">
              <Link to={routes.orgs} className="text-ink hover:text-brand">
                Сводка по клиентам
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {!orgs && <div className="col-span-2 h-[120px] animate-pulse rounded-xl bg-neutral-50" />}
              {summary.map((s) => (
                <div key={s.label} className="rounded-xl bg-neutral-50 px-3 py-2.5">
                  <div className="font-num text-xl leading-[1.2] font-semibold" style={{ color: s.color }}>
                    {s.n}
                  </div>
                  <div className="text-xs text-neutral-500">{s.label}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
