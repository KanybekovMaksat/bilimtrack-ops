import { useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router";
import { HealthPill } from "@/entities/client-health";
import { OrgStatusPill, PRESETS, useOrganization, type OrgModule } from "@/entities/organization";
import { STATUS, TICKETS } from "@/entities/ticket";
import { OrgModuleToggle } from "@/features/toggle-org-module";
import { routes } from "@/shared/config";
import { cn, toPoints } from "@/shared/lib";
import { Avatar, Breadcrumbs, Button, Card, Icon, LineChart, OrgMark, Row, StatusDot, Table, Tabs, Toggle } from "@/shared/ui";

const TABS = [
  { key: "overview", label: "Обзор" },
  { key: "modules", label: "Модули" },
  { key: "structure", label: "Структура" },
  { key: "people", label: "Люди" },
  { key: "activity", label: "Активность" },
  { key: "cases", label: "Обращения" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export function OrgDetailsPage() {
  const { slug = "muit" } = useParams();
  const [params, setParams] = useSearchParams();
  const tab = (params.get("tab") as TabKey) ?? "overview";
  const { org, detail } = useOrganization(slug);
  const [paused, setPaused] = useState(org.status === "На паузе");
  const navigate = useNavigate();

  const accentColor = { danger: "#e7000b", brand: "#155dfc" };

  return (
    <div className="flex max-w-[1180px] flex-col gap-4">
      <Breadcrumbs items={[{ label: "Организации", to: routes.orgs }, { label: org.name }]} />
      <div className="flex items-start gap-4">
        <OrgMark short={org.short} size={52} className="text-neutral-700" />
        <div className="flex-1">
          <div className="flex items-center gap-2.5">
            <h1 className="m-0 text-xl leading-[26px] font-semibold tracking-[-.01em]">{org.name}</h1>
            <OrgStatusPill status={paused ? "На паузе" : "Активна"} />
            <span className="text-xs text-neutral-400">
              {org.type} · {detail.slug}
            </span>
          </div>
          <div className="mt-2 flex gap-[22px]">
            {[
              { n: org.students, l: "учащихся" },
              { n: org.staff, l: "сотрудников" },
              { n: org.branches, l: org.branches === "1" ? "филиал" : "филиала" },
              { n: org.lastActivity, l: "активность" },
            ].map((s) => (
              <div key={s.l}>
                <div className="font-num text-base leading-5 font-semibold">{s.n}</div>
                <div className="text-[11px] text-neutral-400">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setPaused((p) => !p)}>{paused ? "Снять с паузы" : "Поставить на паузу"}</Button>
          <Button icon="dots" aria-label="Ещё" />
        </div>
      </div>

      <div className="grid grid-cols-[minmax(190px,230px)_repeat(5,minmax(0,1fr))] items-center gap-4 rounded-2xl border border-amber-500 bg-amber-50 px-4 py-3.5">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <HealthPill tone={detail.health.tone} onWhite />
            <span className="font-num text-[13px] font-semibold">{detail.health.score} / 100</span>
          </div>
          <div className="text-xs leading-4 text-neutral-600">{detail.health.note}</div>
        </div>
        {detail.healthFacts.map((h) => (
          <div key={h.k} className="flex min-w-0 flex-col gap-0.5">
            <span className="text-[11px] text-neutral-500">{h.k}</span>
            <span className="text-[13px] font-medium" style={{ color: h.accent ? accentColor[h.accent] : undefined }}>
              {h.v}
            </span>
            <span className="text-[11px] text-neutral-400">{h.sub}</span>
          </div>
        ))}
      </div>

      <Tabs items={TABS.map((t) => ({ ...t }))} value={tab} onChange={(k) => setParams({ tab: k }, { replace: true })} />

      {tab === "overview" && (
        <div className="grid grid-cols-[minmax(0,1fr)_300px] items-start gap-4">
          <Card className="flex flex-col gap-3 p-[18px]">
            <div className="text-sm font-medium">Реквизиты</div>
            {detail.fields.map((f) => (
              <div key={f.k} className="flex gap-3 border-b border-neutral-50 pb-2.5">
                <span className="w-[200px] shrink-0 text-xs text-neutral-400">{f.k}</span>
                <span className="flex-1 text-[13px]">{f.v}</span>
              </div>
            ))}
          </Card>
          <Card className="flex flex-col gap-2.5 p-4">
            <div className="text-sm font-medium">Владелец</div>
            <Link to={routes.account(detail.owner.login)} className="flex items-center gap-2.5 text-ink hover:text-ink">
              <Avatar initials={detail.owner.initials} size={34} className="text-xs" />
              <div className="flex-1">
                <div className="text-[13px] font-medium text-brand">{detail.owner.name}</div>
                <div className="text-[11px] text-neutral-400">{detail.owner.login} · Админ организации</div>
              </div>
              <Icon name="arrow-up-right" size={16} className="text-brand" />
            </Link>
          </Card>
        </div>
      )}

      {tab === "modules" && <ModulesTab key={slug} orgName={org.name} staff={org.staff} students={org.students} initial={detail.modules} flagGroups={detail.flagGroups} />}

      {tab === "structure" && (
        <Card className="overflow-hidden">
          <div className="border-b border-neutral-100 px-4 py-3 text-xs text-neutral-500">Только чтение. Структуру меняет администрация организации в своей админке.</div>
          {detail.tree.map((n) => (
            <div key={n.name} className="flex items-center gap-2.5 border-b border-neutral-50 py-2.5 pr-4 last:border-b-0" style={{ paddingLeft: 12 + n.level * 26 }}>
              <Icon name={n.icon} size={17} className="text-neutral-400" />
              <span className="flex-1 text-[13px]">{n.name}</span>
              <span className="text-[11px] text-neutral-400">{n.kind}</span>
            </div>
          ))}
        </Card>
      )}

      {tab === "people" && (
        <Table cols="minmax(0,1fr) 180px minmax(0,1fr) 160px" head={["Сотрудник", "Логин", "Роли", "Последний вход"]}>
          {detail.people.map((p) => (
            <Row key={p.login} onClick={() => navigate(routes.account(p.login))}>
              <span className="flex items-center gap-[9px]">
                <Avatar initials={p.initials} size={26} className="text-[10px]" />
                <span className="text-brand">{p.name}</span>
              </span>
              <span className="font-num text-xs text-neutral-700">{p.login}</span>
              <span className="text-xs text-neutral-500">{p.roles}</span>
              <span className="text-xs text-neutral-400">{p.last}</span>
            </Row>
          ))}
        </Table>
      )}

      {tab === "activity" && (
        <Card className="p-[18px]">
          <div className="mb-3.5 text-sm font-medium">Входы и ключевые действия · 90 дней</div>
          <LineChart width={900} height={160} guides={[20, 75, 130]} series={[{ points: toPoints(detail.activity, 900, (v) => 130 - (v / 130) * 120), color: "#155dfc" }]} />
          <div className="mt-1.5 flex justify-between text-[10px] text-neutral-400">
            <span>22 июн</span>
            <span>5 авг</span>
            <span>20 сен</span>
          </div>
        </Card>
      )}

      {tab === "cases" && (
        <Card className="overflow-hidden rounded-xl">
          {TICKETS.filter((t) => t.org === org.name)
            .concat(org.name === "МУИТ" ? [] : TICKETS.slice(0, 3))
            .slice(0, 5)
            .map((t) => (
              <div
                key={t.id}
                onClick={() => navigate(routes.ticket(t.id))}
                className="flex cursor-pointer items-center gap-3 border-b border-neutral-100 px-3.5 py-[11px] last:border-b-0 hover:bg-neutral-50"
              >
                <span className="w-[120px] font-num text-xs text-neutral-500">{t.id}</span>
                <span className="flex-1 text-[13px]">{t.subject}</span>
                <span className="text-xs text-neutral-500">{t.category}</span>
                <span className="w-[100px]">
                  <StatusDot color={STATUS[t.status].color} className="text-ink">
                    {STATUS[t.status].label}
                  </StatusDot>
                </span>
                <span className="w-[100px] text-right text-xs text-neutral-400">{t.updated}</span>
              </div>
            ))}
        </Card>
      )}
    </div>
  );
}

type ModulesTabProps = {
  orgName: string;
  staff: string;
  students: string;
  initial: OrgModule[];
  flagGroups: { title: string; flags: { name: string; on: boolean }[] }[];
};

function ModulesTab({ orgName, staff, students, initial, flagGroups: initialFlags }: ModulesTabProps) {
  const [preset, setPreset] = useState("Университет");
  const [modules, setModules] = useState(initial);
  const [flags, setFlags] = useState(initialFlags);

  const setModule = (key: string, on: boolean) => setModules((ms) => ms.map((m) => (m.key === key ? { ...m, on } : m)));
  const setFeature = (key: string, name: string, on: boolean) =>
    setModules((ms) => ms.map((m) => (m.key === key ? { ...m, features: m.features.map((f) => (f.name === name ? { ...f, on } : f)) } : m)));
  const setFlag = (group: string, name: string, on: boolean) =>
    setFlags((gs) => gs.map((g) => (g.title === group ? { ...g, flags: g.flags.map((f) => (f.name === name ? { ...f, on } : f)) } : g)));

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-wrap items-center gap-3 px-4 py-3.5">
        <div>
          <div className="text-sm font-medium">Пресет под тип заведения</div>
          <div className="text-xs text-neutral-500">Набор модулей и настроек одним нажатием. Дальше можно менять вручную.</div>
        </div>
        <div className="flex-1" />
        <div className="flex gap-1.5">
          {PRESETS.map((p) => (
            <Button key={p} size="sm" variant={p === preset ? "primary" : "outline"} className={p === preset ? "" : "text-neutral-700"} onClick={() => setPreset(p)}>
              {p}
            </Button>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-2 items-start gap-3">
        {modules.map((m) => (
          <div key={m.key} className={cn("overflow-hidden rounded-2xl border", m.on ? "border-neutral-200" : "border-neutral-100")}>
            <div className="flex items-center gap-3 border-b border-neutral-100 bg-neutral-50 px-4 py-[13px]">
              <div className="flex-1">
                <div className={cn("text-sm font-semibold", m.on ? "text-ink" : "text-neutral-400")}>{m.name}</div>
                <div className="text-[11px] text-neutral-400">{m.description}</div>
              </div>
              <OrgModuleToggle module={m} orgName={orgName} staff={staff} students={students} onChange={(on) => setModule(m.key, on)} />
            </div>
            <div className="px-4 pt-1.5 pb-3">
              {m.features.map((f) => (
                <div key={f.name} className="ml-1 flex items-center gap-2.5 border-l-2 border-neutral-100 py-2 pl-3.5">
                  <span className={cn("flex-1 text-[13px]", !m.on ? "text-neutral-300" : f.on ? "text-ink" : "text-neutral-500")}>
                    {f.name}
                    {!m.on && <span className="text-[11px] text-neutral-400"> недоступно: модуль выключен</span>}
                  </span>
                  <Toggle size="sm" on={m.on && f.on} disabled={!m.on} label={f.name} onChange={(on) => setFeature(m.key, f.name, on)} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Card className="p-4">
        <div className="mb-0.5 text-sm font-medium">Настройки</div>
        <div className="mb-3.5 text-xs text-neutral-500">Двадцать флагов, сгруппированы по смыслу. Пресет «{preset}» уже расставил их — здесь только правки.</div>
        <div className="grid grid-cols-4 gap-[18px]">
          {flags.map((g) => (
            <div key={g.title} className="flex flex-col gap-2">
              <div className="text-[11px] font-semibold tracking-[.05em] text-neutral-400 uppercase">{g.title}</div>
              {g.flags.map((f) => (
                <div key={f.name} className="flex items-center gap-2">
                  <Toggle size="sm" on={f.on} label={f.name} onChange={(on) => setFlag(g.title, f.name, on)} />
                  <span className="text-[13px] leading-[17px]">{f.name}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
