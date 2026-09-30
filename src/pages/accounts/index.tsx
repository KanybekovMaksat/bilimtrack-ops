import { useNavigate } from "react-router";
import {
  ACCOUNTS_PAGE_SIZE,
  accountKindLabel,
  accountName,
  formatLastLogin,
  useAccounts,
  type AccountKind,
} from "@/entities/account";
import { useOrganizationsSoft } from "@/entities/organization";
import { routes } from "@/shared/config";
import { formatInt, orgShort, plural, useUrlFilters, useUrlSearch } from "@/shared/lib";
import { Avatar, Callout, Cell, EmptyState, FilterChip, FilterSelect, OrgMark, PageHeader, Pager, Pill, Row, SearchInput, Table } from "@/shared/ui";

// Platform admins live in «Команда», not among client accounts.
const KINDS: AccountKind[] = ["employee", "learner", "guardian", "no_membership"];
const STATUSES = ["active", "inactive"] as const;

export function AccountsPage() {
  const navigate = useNavigate();
  const f = useUrlFilters();
  // Header search navigates here with a new ?q=: the box follows it.
  const [query, setQuery] = useUrlSearch(f);
  const q = f.get("q") ?? "";
  const page = f.num("page") ?? 1;
  const filters = {
    organizationId: f.num("org"),
    kind: f.oneOf("kind", KINDS),
    status: f.oneOf("status", STATUSES),
    neverLoggedIn: f.flag("neverLoggedIn") || undefined,
  };
  const orgs = useOrganizationsSoft();

  const list = useAccounts({ ...filters, q: q.length >= 2 ? q : undefined, page });
  const total = list.data?.count ?? 0;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Аккаунты" subtitle={list.data ? `${formatInt(total)} ${plural(total, ["учётная запись", "учётные записи", "учётных записей"])} по фильтрам` : "все учётные записи платформы"} />
      <div className="flex flex-wrap items-center gap-2">
        <SearchInput width={300} placeholder="Логин, почта, телефон или ФИО" value={query} onChange={setQuery} />
        <FilterSelect
          label="Организация"
          allLabel="Все организации"
          searchPlaceholder="Название организации"
          menuWidth={340}
          value={filters.organizationId ? String(filters.organizationId) : undefined}
          onChange={(v) => f.set({ org: v })}
          options={(orgs.data ?? []).map((o) => ({ value: String(o.id), label: o.name }))}
        />
        <FilterSelect
          label="Кто"
          allLabel="Все роли"
          value={filters.kind}
          onChange={(v) => f.set({ kind: v })}
          options={KINDS.map((k) => ({ value: k, label: accountKindLabel[k] }))}
        />
        <FilterSelect
          label="Статус"
          allLabel="Любой статус"
          value={filters.status}
          onChange={(v) => f.set({ status: v })}
          options={[
            { value: "active", label: "Активные" },
            { value: "inactive", label: "Отключённые" },
          ]}
        />
        <FilterChip icon="zzz" tone={filters.neverLoggedIn ? "warn" : "default"} label="Ни разу не входили" onClick={() => f.set({ neverLoggedIn: !filters.neverLoggedIn })} />
        {list.isFetching && <span className="text-xs text-neutral-400">Загрузка…</span>}
      </div>
      {q.length === 1 && <div className="text-xs text-neutral-400">Для поиска нужно минимум 2 символа.</div>}

      {list.error ? (
        <Callout tone="danger">{list.error.message}</Callout>
      ) : list.data && !list.data.rows.length ? (
        <div className="rounded-xl border border-neutral-200">
          <EmptyState icon="user-search" title="Никого не найдено" description="Поиск идёт по логину, почте, телефону и ФИО в профилях всех организаций." />
        </div>
      ) : (
        <Table
          cols="minmax(170px,1fr) minmax(190px,1.1fr) minmax(200px,1.2fr) 110px 150px"
          minWidth={960}
          head={["Логин", "Имя и контакты", "Организации", "Статус", "Последний вход"]}
        >
          {(list.data?.rows ?? []).map((a) => {
            const name = accountName(a);
            const orgNames = [...new Map([...a.memberships.map((m) => m.organization), ...a.profiles.map((p) => p.organization)].map((o) => [o.id, o])).values()];
            return (
              <Row key={a.id} onClick={() => navigate(routes.account(a.username))}>
                <span className="flex min-w-0 items-center gap-2">
                  <Avatar icon={a.operator ? "shield-lock" : "key"} size={26} tone={a.operator ? "brand" : "neutral"} />
                  <Cell className="font-num font-medium">{a.username}</Cell>
                </span>
                <span className="min-w-0">
                  <Cell className="block">{name || <span className="text-neutral-400">—</span>}</Cell>
                  <Cell className="block text-[11px] text-neutral-400">{[a.phone, a.email].filter(Boolean).join(" · ") || "нет контактов"}</Cell>
                </span>
                <span className="flex min-w-0 items-center gap-1.5">
                  {a.operator ? (
                    <Pill size="sm" tone="info">
                      {a.operator.roleLabel}
                    </Pill>
                  ) : orgNames.length ? (
                    <>
                      <OrgMark short={orgShort(orgNames[0].name)} size={18} />
                      <Cell className="text-xs text-neutral-700">{orgNames[0].name}</Cell>
                      {orgNames.length > 1 && <span className="shrink-0 text-[11px] text-neutral-400">+{orgNames.length - 1}</span>}
                    </>
                  ) : (
                    <span className="text-xs text-warn">без организации</span>
                  )}
                </span>
                <span>
                  <Pill size="sm" tone={a.isActive ? "success" : "neutral"}>
                    {a.isActive ? "Активен" : "Отключён"}
                  </Pill>
                </span>
                <span className="text-xs text-neutral-500">{formatLastLogin(a.lastLogin)}</span>
              </Row>
            );
          })}
          {list.isLoading && <div className="h-40 animate-pulse bg-neutral-50" />}
        </Table>
      )}

      {total > ACCOUNTS_PAGE_SIZE && <Pager page={page} pageSize={ACCOUNTS_PAGE_SIZE} total={total} onPage={(p) => f.set({ page: p })} />}
    </div>
  );
}
