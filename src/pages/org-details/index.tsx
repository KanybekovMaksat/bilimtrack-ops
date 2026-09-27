import { useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router";
import {
  OrgCategoryPill,
  OrgStatusPill,
  structureTree,
  useOrgMembers,
  useOrganization,
  useSetOrgSettings,
  type OrgMember,
  type OrgStatus,
  type OrganizationDetail,
} from "@/entities/organization";
import { useCan } from "@/entities/session";
import { AddPersonModal, EditMembershipModal } from "@/features/add-person";
import { EditLicenseModal } from "@/features/edit-license";
import { ContractsPanel } from "@/features/manage-contracts";
import { DeleteOrganizationModal, EditOrganizationModal, OrgLogoPicker, OrgStatusModal } from "@/features/manage-organization";
import { OrgModuleToggle } from "@/features/toggle-org-module";
import { routes } from "@/shared/config";
import { cn, formatAgo, formatDate, formatInt, initialsOf, plural } from "@/shared/lib";
import { Avatar, Breadcrumbs, Button, Callout, Card, EmptyState, Icon, Pill, Row, SearchInput, Table, Tabs, Toggle } from "@/shared/ui";

const TABS = [
  { key: "overview", label: "Обзор" },
  { key: "modules", label: "Модули и настройки" },
  { key: "structure", label: "Структура" },
  { key: "people", label: "Люди" },
  { key: "contracts", label: "Договоры" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export function OrgDetailsPage() {
  const { id = "" } = useParams();
  const orgId = Number(id);
  if (!Number.isInteger(orgId) || orgId <= 0) {
    return <EmptyState icon="building" title="Организация не найдена" description="Откройте её из списка организаций." />;
  }
  return <OrgDetails key={orgId} orgId={orgId} />;
}

function OrgDetails({ orgId }: { orgId: number }) {
  const [params, setParams] = useSearchParams();
  const tab = (params.get("tab") as TabKey) ?? "overview";
  const org = useOrganization(orgId);
  const navigate = useNavigate();
  const can = useCan();
  const manage = can("organizations");
  const [statusTarget, setStatusTarget] = useState<OrgStatus | null>(null);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  return (
    <div className="flex max-w-[1180px] flex-col gap-4">
      <Breadcrumbs items={[{ label: "Организации", to: routes.orgs }, { label: org.name }]} />
      <div className="flex items-start gap-4">
        <OrgLogoPicker org={org} />
        <div className="flex-1">
          <div className="flex items-center gap-2.5">
            <h1 className="m-0 text-xl leading-[26px] font-semibold tracking-[-.01em]">{org.name}</h1>
            <OrgStatusPill status={org.status} />
            <OrgCategoryPill category={org.category} />
            <span className="text-xs text-neutral-400">
              {org.typeLabel} · {org.slug}
            </span>
          </div>
          <div className="mt-2 flex gap-[22px]">
            {[
              { n: formatInt(org.learnersCount), l: "учащихся" },
              { n: formatInt(org.employeesCount), l: "сотрудников" },
              { n: formatInt(org.membersCount), l: "с доступом в систему" },
              { n: String(org.branchesCount), l: plural(org.branchesCount, ["филиал", "филиала", "филиалов"]) },
              { n: formatAgo(org.lastActivityAt), l: "последний вход" },
            ].map((s) => (
              <div key={s.l}>
                <div className="font-num text-base leading-5 font-semibold">{s.n}</div>
                <div className="text-[11px] text-neutral-400">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
        {manage && (
          <div className="flex items-center gap-1.5">
            <Button icon="pencil" onClick={() => setEditing(true)}>
              Изменить
            </Button>
            {org.status === "active" ? (
              <Button icon="power" onClick={() => setStatusTarget("inactive")}>
                Отключить
              </Button>
            ) : (
              <Button icon="power" variant="primary" onClick={() => setStatusTarget("active")}>
                Включить
              </Button>
            )}
            {org.status !== "archived" && <Button size="lg" icon="archive" title="В архив" aria-label="В архив" onClick={() => setStatusTarget("archived")} />}
            <Button size="lg" variant="dangerOutline" icon="trash" title="Удалить" aria-label="Удалить" onClick={() => setDeleting(true)} />
          </div>
        )}
      </div>

      {org.status !== "active" && (
        <Callout tone="warn" icon="alert-triangle" iconClassName="text-warn">
          {org.status === "inactive" ? "Организация отключена." : `Организация в архиве с ${formatDate(org.archivedAt)}.`} Статус меняет только команда Bilimtrack.
        </Callout>
      )}

      <Tabs items={TABS.map((t) => ({ ...t }))} value={tab} onChange={(k) => setParams({ tab: k }, { replace: true })} />

      {tab === "overview" && <OverviewTab org={org} />}
      {tab === "modules" && <ModulesTab org={org} />}
      {tab === "structure" && <StructureTab org={org} />}
      {tab === "people" && <PeopleTab org={org} />}
      {tab === "contracts" && <ContractsPanel orgId={org.id} orgName={org.name} />}

      {statusTarget && <OrgStatusModal org={org} target={statusTarget} onClose={() => setStatusTarget(null)} />}
      {editing && <EditOrganizationModal org={org} onClose={() => setEditing(false)} />}
      {deleting && <DeleteOrganizationModal org={org} onClose={() => setDeleting(false)} onDeleted={() => navigate(routes.orgs, { replace: true })} />}
    </div>
  );
}

function OverviewTab({ org }: { org: OrganizationDetail }) {
  const fields: [string, string][] = [
    ["Юридическое название", org.legalName || "—"],
    ["Краткое название", org.shortName || "—"],
    ["Тип", org.typeLabel],
    ["Категория", org.category === "beta" ? "Beta — не входит в основные метрики" : "Клиент"],
    ["Слаг", org.slug],
    ["ИНН", org.taxId || "—"],
    ["Контакты", [org.phone, org.email].filter(Boolean).join(" · ") || "—"],
    ["Сайт", org.website || "—"],
    ["Адрес", org.address || "—"],
    ["Часовой пояс", org.timezone],
    ["Язык · страна", `${org.locale} · ${org.country}`],
    ["Подключена", formatDate(org.createdAt)],
  ];
  const license = org.license;
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_320px] items-start gap-4">
      <Card className="flex flex-col gap-3 p-[18px]">
        <div className="text-sm font-medium">Реквизиты</div>
        {fields.map(([k, v]) => (
          <div key={k} className="flex gap-3 border-b border-neutral-50 pb-2.5 last:border-b-0">
            <span className="w-[200px] shrink-0 text-xs text-neutral-400">{k}</span>
            <span className="flex-1 text-[13px]">{v}</span>
          </div>
        ))}
        <div className="text-[11px] text-neutral-400">Реквизиты меняет администрация организации в своей админке или команда Bilimtrack кнопкой «Изменить».</div>
      </Card>
      <div className="flex flex-col gap-3">
        <Card className="flex flex-col gap-2.5 p-4">
          <div className="text-sm font-medium">Владелец</div>
          {org.owner ? (
            <Link to={routes.account(org.owner.username)} className="flex items-center gap-2.5 text-ink hover:text-ink">
              <Avatar initials={initialsOf(org.owner.username)} size={34} className="text-xs" />
              <div className="flex-1 font-num text-[13px] font-medium text-brand">{org.owner.username}</div>
              <Icon name="arrow-up-right" size={16} className="text-brand" />
            </Link>
          ) : (
            <div className="text-[13px] text-neutral-400">Не назначен</div>
          )}
        </Card>
        <Card className="flex flex-col gap-2 p-4">
          <div className="flex items-center gap-2">
            <div className="flex-1 text-sm font-medium">Лицензия</div>
            <Link to={`${routes.org(org.id)}?tab=modules`} className="text-xs">
              Модули →
            </Link>
          </div>
          {license ? (
            <>
              <div className="text-[13px]">
                Пакет «{license.planLabel}» · {license.licensedModules.length} {plural(license.licensedModules.length, ["модуль", "модуля", "модулей"])}
              </div>
              <div className="text-xs text-neutral-500">
                {license.validUntil ? `до ${formatDate(license.validUntil)}` : "срок не указан"}
                {license.note && ` · ${license.note}`}
              </div>
            </>
          ) : (
            <div className="text-[13px] text-neutral-400">Договор в Ops не заведён</div>
          )}
        </Card>
        <Card className="flex flex-col gap-2 p-4">
          <div className="text-sm font-medium">Обращения</div>
          <div className="text-[13px]">
            {org.openTicketsCount ? (
              <span className="font-medium text-red-600">
                {org.openTicketsCount} {plural(org.openTicketsCount, ["открытый тикет", "открытых тикета", "открытых тикетов"])}
              </span>
            ) : (
              <span className="text-neutral-500">Открытых тикетов нет</span>
            )}
          </div>
          <Link to={routes.tickets} className="text-xs">
            Все тикеты →
          </Link>
        </Card>
      </div>
    </div>
  );
}

function ModulesTab({ org }: { org: OrganizationDetail }) {
  const [editing, setEditing] = useState(false);
  const setSettings = useSetOrgSettings(org.id);
  const enabled = org.modules.filter((m) => m.isEnabled).length;
  const mismatches = org.modules.filter((m) => m.isLicensed !== null && m.isLicensed !== m.isEnabled);

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-wrap items-center gap-3 px-4 py-3.5">
        <div>
          <div className="text-sm font-medium">
            {org.license ? `Лицензия: пакет «${org.license.planLabel}»` : "Лицензия не заведена"}
            <span className="ml-2 text-xs font-normal text-neutral-400">
              включено {enabled} из {org.modules.length}
            </span>
          </div>
          <div className="text-xs text-neutral-500">
            {org.license
              ? mismatches.length
                ? `Расхождений с договором: ${mismatches.length}`
                : "Включённые модули совпадают с договором"
              : "Запишите договор, чтобы видеть расхождения с ним"}
          </div>
        </div>
        <div className="flex-1" />
        <Button icon="file-text" onClick={() => setEditing(true)}>
          {org.license ? "Изменить лицензию" : "Записать лицензию"}
        </Button>
      </Card>

      <div className="grid grid-cols-2 items-start gap-3">
        {org.modules.map((m) => {
          const diff = m.isLicensed !== null && m.isLicensed !== m.isEnabled;
          return (
            <div key={m.code} className={cn("flex items-center gap-3 rounded-2xl border px-4 py-[13px]", m.isEnabled ? "border-neutral-200" : "border-neutral-100 bg-neutral-50")}>
              <div className="min-w-0 flex-1">
                <div className={cn("flex items-center gap-2 text-sm font-semibold", m.isEnabled ? "text-ink" : "text-neutral-400")}>
                  {m.name}
                  {m.isLicensed && (
                    <Pill size="sm" tone="info" className="font-normal">
                      в договоре
                    </Pill>
                  )}
                  {diff && (
                    <Pill size="sm" tone="orange" className="font-normal">
                      {m.isEnabled ? "вне договора" : "не включён"}
                    </Pill>
                  )}
                </div>
                <div className="text-[11px] text-neutral-400">{m.description}</div>
              </div>
              <OrgModuleToggle organizationId={org.id} module={m} orgName={org.name} staff={org.employeesCount} learners={org.learnersCount} />
            </div>
          );
        })}
      </div>

      <Card className="p-4">
        <div className="mb-0.5 text-sm font-medium">Настройки учебного процесса</div>
        <div className="mb-3.5 text-xs text-neutral-500">Флаги организации: включают разделы и поля внутри модулей. Сохраняются сразу.</div>
        {setSettings.error && <div className="mb-3 rounded-xl bg-red-50 px-3.5 py-2.5 text-xs text-red-600">{setSettings.error.message}</div>}
        <div className="grid grid-cols-3 gap-x-[18px] gap-y-2.5">
          {org.settings.map((s) => (
            <div key={s.code} className="flex items-center gap-2">
              <Toggle size="sm" on={s.isEnabled} label={s.label} disabled={setSettings.isPending} onChange={(on) => setSettings.mutate({ [s.code]: on })} />
              <span className="text-[13px] leading-[17px]">{s.label}</span>
            </div>
          ))}
        </div>
      </Card>

      {editing && (
        <EditLicenseModal
          organization={org}
          current={{
            plan: org.license?.plan ?? null,
            licensedModules: org.license?.licensedModules ?? null,
            enabledModules: org.enabledModules,
            validFrom: org.license?.validFrom ?? null,
            validUntil: org.license?.validUntil ?? null,
            note: org.license?.note ?? "",
          }}
          onClose={() => setEditing(false)}
        />
      )}
    </div>
  );
}

function StructureTab({ org }: { org: OrganizationDetail }) {
  const tree = structureTree(org);
  return (
    <Card className="overflow-hidden">
      <div className="border-b border-neutral-100 px-4 py-3 text-xs text-neutral-500">Только чтение. Структуру меняет администрация организации в своей админке.</div>
      <div className="flex items-center gap-2.5 border-b border-neutral-50 px-3 py-2.5">
        <Icon name="building" size={17} className="text-neutral-400" />
        <span className="flex-1 text-[13px] font-medium">{org.name}</span>
        <span className="text-[11px] text-neutral-400">Организация</span>
      </div>
      {tree.length ? (
        tree.map((n) => (
          <div key={n.key} className="flex items-center gap-2.5 border-b border-neutral-50 py-2.5 pr-4 last:border-b-0" style={{ paddingLeft: 38 + n.level * 26 }}>
            <Icon name={n.icon} size={17} className="text-neutral-400" />
            <span className="flex-1 text-[13px]">{n.name}</span>
            <span className="text-[11px] text-neutral-400">{n.kind}</span>
          </div>
        ))
      ) : (
        <div className="px-4 py-6 text-center text-[13px] text-neutral-400">Филиалы и подразделения не заведены</div>
      )}
    </Card>
  );
}

function PeopleTab({ org }: { org: OrganizationDetail }) {
  const navigate = useNavigate();
  const can = useCan();
  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<OrgMember | null>(null);
  const members = useOrgMembers(org.id, query.trim());

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <SearchInput placeholder="Логин, почта, телефон" value={query} onChange={setQuery} />
        <span className="flex-1 text-xs text-neutral-400">Участники с доступом в систему · {members.data?.length ?? "…"}</span>
        {can("accounts") && (
          <Button variant="primary" icon="user-plus" onClick={() => setAdding(true)}>
            Добавить человека
          </Button>
        )}
      </div>
      {members.error ? (
        <Callout tone="danger">{members.error.message}</Callout>
      ) : (
        <Table cols="minmax(0,1.2fr) 190px minmax(0,1fr) 110px 150px 44px" head={["Человек", "Логин", "Роли", "Статус", "Последний вход", ""]}>
          {(members.data ?? []).map((m) => (
            <Row key={m.id} onClick={() => navigate(routes.account(m.user.username))}>
              <span className="flex min-w-0 items-center gap-[9px]">
                <Avatar initials={initialsOf(m.fullName || m.user.username)} size={26} className="text-[10px]" />
                <span className="truncate text-brand">{m.fullName || "—"}</span>
                {m.isOwner && (
                  <Pill size="sm" tone="info" className="font-normal">
                    владелец
                  </Pill>
                )}
              </span>
              <span className="truncate font-num text-xs text-neutral-700">{m.user.username}</span>
              <span className="truncate text-xs text-neutral-500">{m.roles.map((r) => r.name).join(", ") || "без ролей"}</span>
              <span>
                <Pill size="sm" tone={m.status === "active" ? "success" : m.status === "suspended" ? "orange" : "neutral"}>
                  {m.status === "active" ? "Активен" : m.status === "suspended" ? "Приостановлен" : m.status}
                </Pill>
              </span>
              <span className="text-xs text-neutral-400">{formatAgo(m.user.lastLogin)}</span>
              <span className="text-right">
                {can("accounts") && (
                  <Button
                    size="xs"
                    variant="ghost"
                    icon="pencil"
                    aria-label="Роли и статус"
                    title="Роли и статус доступа"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditing(m);
                    }}
                  />
                )}
              </span>
            </Row>
          ))}
          {members.isLoading && <div className="h-24 animate-pulse bg-neutral-50" />}
          {members.data?.length === 0 && <div className="px-4 py-6 text-center text-[13px] text-neutral-400">Никого не найдено</div>}
        </Table>
      )}
      {adding && <AddPersonModal org={org} onClose={() => setAdding(false)} />}
      {editing && <EditMembershipModal org={org} member={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}
