import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { leadStatusLabel, useLeadsSoft } from "@/entities/lead";
import { orgCategory, useOrganizationsSoft, usePlatformSummary } from "@/entities/organization";
import { useCan } from "@/entities/session";
import { SOURCE, useTicketList, useTicketSummary } from "@/entities/ticket";
import { routes } from "@/shared/config";
import { formatDayMonth, formatInt, formatRelative, formatWeekdayDate, toPoints } from "@/shared/lib";
import { Card, CardHeader, Icon, type IconName, LineChart, SectionLabel } from "@/shared/ui";

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

const dayLabel = (ms: number) => formatDayMonth(ms);

export function HomePage() {
  const can = useCan();
  // The newest tickets feed the event list and the 30-day chart; the counters come from the server summary.
  const tickets = useTicketList({ ordering: "-created", pageSize: 500 }, { enabled: can("support") }).data?.rows ?? [];
  const ticketSummary = useTicketSummary({}, { enabled: can("support") }).data;
  const leads = useLeadsSoft({ enabled: can("sales") }).data ?? [];
  const orgs = useOrganizationsSoft().data;
  const platform = usePlatformSummary();
  // Beta organizations never count in the main metrics. Until ops/summary is deployed, the org list stands in.
  const clients = orgs?.filter((o) => orgCategory(o) !== "beta");
  const orgStats = platform.data?.organizations ?? (clients && {
    total: clients.length,
    active: clients.filter((o) => o.status === "active").length,
    inactive: clients.filter((o) => o.status === "inactive").length,
    archived: clients.filter((o) => o.status === "archived").length,
    beta: (orgs?.length ?? 0) - clients.length,
  });
  const users = platform.data?.users;
  const metrics = [
    { label: "Пользователей в организациях", n: users?.inClients, sub: users ? `всего аккаунтов ${formatInt(users.total)}` : "без beta-организаций", icon: "users", color: "var(--color-brand)", to: routes.accounts },
    { label: "Активны за 30 дней", n: users?.active30d, sub: users ? `учащихся ${formatInt(users.learners)} · сотрудников ${formatInt(users.employees)}` : "входили хотя бы раз", icon: "heartbeat", color: "var(--color-green-600)", to: routes.logins },
    { label: "Организаций активно", n: orgStats?.active, sub: orgStats ? `из ${formatInt(orgStats.total)} клиентов` : "", icon: "building", color: "var(--color-green-600)", to: routes.orgs },
    { label: "Организаций неактивно", n: orgStats?.inactive, sub: orgStats ? `в архиве ${formatInt(orgStats.archived)}` : "", icon: "power", color: "var(--color-amber-500)", to: routes.orgs },
  ] as const;
  const summary = clients
    ? [
        { n: formatInt(clients.reduce((a, o) => a + o.learnersCount, 0)), label: "Учащихся у клиентов", color: "var(--color-ink)" },
        { n: formatInt(clients.reduce((a, o) => a + o.employeesCount, 0)), label: "Сотрудников у клиентов", color: "var(--color-ink)" },
        { n: formatInt(clients.reduce((a, o) => a + o.openTicketsCount, 0)), label: "Открытых тикетов", color: "var(--color-red-500)" },
        { n: formatInt(orgStats?.beta ?? 0), label: "Beta-организаций (вне метрик)", color: "var(--color-violet-500)" },
      ]
    : [];
  const navigate = useNavigate();
  const [now] = useState(() => Date.now());

  // Only the queues this admin may open.
  const queue = ([
    { n: leads.filter((l) => l.status === "new").length, label: "Новые заявки на демо", icon: "inbox", color: "var(--color-brand)", to: routes.leads, perm: "sales" },
    { n: (ticketSummary?.open ?? 0) + (ticketSummary?.inProgress ?? 0), label: "Открытые тикеты", icon: "lifebuoy", color: "var(--color-ink)", to: routes.tickets, perm: "support" },
    { n: ticketSummary?.unread ?? 0, label: "Непрочитанные сообщения", icon: "mail", color: "var(--color-brand)", to: `${routes.tickets}?tab=all&unread=1`, perm: "support" },
    { n: ticketSummary?.sla.over ?? 0, label: "Просрочен первый ответ", icon: "clock-exclamation", color: "var(--color-red-500)", to: `${routes.tickets}?tab=all&sla=over`, perm: "support" },
    { n: tickets.filter((t) => t.status === "open" && !t.hasAccount).length, label: "Обращения без аккаунта", icon: "user-search", color: "var(--color-amber-500)", to: `${routes.tickets}?org=none`, perm: "support" },
  ] as const).filter((q) => can(q.perm));

  const events = [
    ...tickets.map((t) => ({
      at: t.createdAt,
      icon: (SOURCE[t.source]?.icon ?? "lifebuoy") as IconName,
      tint: "var(--color-brand-50)",
      color: "var(--color-brand)",
      text: `Тикет ${t.number}: «${t.subject}»`,
      sub: `${t.author} · ${SOURCE[t.source]?.label ?? ""}`,
      to: routes.ticket(t.id),
    })),
    ...leads.map((l) => ({
      at: l.createdAt,
      icon: "inbox" as IconName,
      tint: "var(--color-orange-50)",
      color: "var(--color-amber-500)",
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
        <span className="text-[13px] text-neutral-400">{formatWeekdayDate(now)}</span>
      </div>

      <div>
        <SectionLabel className="mb-2">Платформа · без beta-организаций</SectionLabel>
        <div className="grid grid-cols-4 gap-3">
          {metrics.map((m) => (
            <Link key={m.label} to={m.to} className="flex flex-col gap-2 rounded-2xl border border-neutral-200 bg-neutral-50/60 p-4 text-ink hover:border-brand hover:text-ink">
              <div className="flex items-center gap-2 text-[13px] text-neutral-600">
                <span className="flex size-7 items-center justify-center rounded-lg bg-white" style={{ color: m.color }}>
                  <Icon name={m.icon} size={16} />
                </span>
                <span className="flex-1 leading-[16px]">{m.label}</span>
              </div>
              <div className="font-num text-[30px] leading-none font-semibold">{m.n == null ? (platform.isLoading || !orgs ? "…" : "—") : formatInt(m.n)}</div>
              <div className="truncate text-[11px] text-neutral-400">{m.sub || " "}</div>
            </Link>
          ))}
        </div>
        {platform.isError && (
          <div className="mt-2 text-[11px] text-neutral-400">Число пользователей появится, когда на сервер выкатят эндпоинт ops/summary/. Организации посчитаны по списку.</div>
        )}
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
                { points: toPoints(ticketSeries, 560, y), color: "var(--color-orange-400)" },
                { points: toPoints(leadsSeries, 560, y), color: "var(--color-brand)" },
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
