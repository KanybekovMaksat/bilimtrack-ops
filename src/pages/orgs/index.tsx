import { useNavigate } from "react-router";
import { ORG_TYPES, OrgCategoryPill, OrgStatusPill, STALE_DAYS, isStale, orgCategory, orgCategoryLabel, orgMark, orgStatusLabel, useOrganizations, type OrgCategory, type OrgStatus } from "@/entities/organization";
import { useCan } from "@/entities/session";
import { routes } from "@/shared/config";
import { cn, formatAgo, formatDate, formatInt, plural, sortRows, useUrlFilters, useUrlSearch } from "@/shared/lib";
import { Button, Cell, EmptyState, ExportButton, FilterChip, FilterMultiSelect, FilterReset, Icon, Num, OrgMark, PageHeader, Row, SearchInput, Table } from "@/shared/ui";

const STATUSES: OrgStatus[] = ["active", "inactive", "archived"];
const CATEGORIES: OrgCategory[] = ["client", "beta"];

export function OrgsPage() {
  const orgs = useOrganizations();
  const navigate = useNavigate();
  const f = useUrlFilters();
  const [query, setQuery] = useUrlSearch(f, 250);
  const types = f.list("type", ORG_TYPES.map((t) => t.value));
  const statuses = f.list("status", STATUSES);
  const categories = f.list("category", CATEGORIES);
  const staleOnly = f.flag("stale");
  const can = useCan();

  const q = query.trim().toLowerCase();
  const staleCount = orgs.filter((o) => isStale(o)).length;
  const sort = f.get("sort");
  const filtered = orgs.filter(
    (o) =>
      (!staleOnly || isStale(o)) &&
      (!types.length || types.includes(o.type)) &&
      (!statuses.length || statuses.includes(o.status)) &&
      (!categories.length || categories.includes(orgCategory(o))) &&
      (!q || `${o.name} ${o.shortName} ${o.legalName} ${o.slug}`.toLowerCase().includes(q)),
  );
  const rows = sortRows(filtered, sort, {
    name: (o) => o.name,
    type: (o) => o.typeLabel,
    status: (o) => orgStatusLabel[o.status],
    learners: (o) => o.learnersCount,
    employees: (o) => o.employeesCount,
    branches: (o) => o.branchesCount,
    tickets: (o) => o.openTicketsCount,
    created: (o) => o.createdAt,
    activity: (o) => o.lastActivityAt,
  });

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Организации"
        subtitle={`${orgs.length} ${plural(orgs.length, ["организация", "организации", "организаций"])} · beta ${orgs.filter((o) => orgCategory(o) === "beta").length} · учащиеся ${formatInt(orgs.reduce((a, o) => a + o.learnersCount, 0))}`}
        actions={
          can("organizations") && (
            <Button variant="primary" icon="plus" onClick={() => navigate(routes.orgNew)}>
              Новая организация
            </Button>
          )
        }
      />
      <div className="flex flex-wrap items-center gap-2">
        <SearchInput placeholder="Название, слаг" value={query} onChange={setQuery} />
        <FilterMultiSelect label="Тип" allLabel="Все типы" values={types} onChange={(v) => f.set({ type: v })} options={ORG_TYPES} />
        <FilterMultiSelect
          label="Статус"
          allLabel="Все статусы"
          values={statuses}
          onChange={(v) => f.set({ status: v })}
          options={STATUSES.map((s) => ({ value: s, label: orgStatusLabel[s] }))}
        />
        <FilterMultiSelect
          label="Категория"
          allLabel="Все категории"
          values={categories}
          onChange={(v) => f.set({ category: v })}
          options={CATEGORIES.map((c) => ({ value: c, label: orgCategoryLabel[c] }))}
        />
        <FilterChip
          tone={staleOnly ? "warn" : "default"}
          icon="zzz"
          label={`Без входов ${STALE_DAYS}+ дней · ${staleCount}`}
          onClick={() => f.set({ stale: !staleOnly })}
        />
        <FilterReset filters={f} keys={["q", "type", "status", "category", "stale"]} />
        <ExportButton
          filename="organizations"
          head={["Название", "Юр. название", "Слаг", "Тип", "Статус", "Категория", "Учащихся", "Сотрудников", "Филиалов", "Открытых тикетов", "Подключена", "Последний вход"]}
          load={() => rows}
          row={(o) => [
            o.name,
            o.legalName,
            o.slug,
            o.typeLabel,
            orgStatusLabel[o.status],
            orgCategoryLabel[orgCategory(o)],
            o.learnersCount,
            o.employeesCount,
            o.branchesCount,
            o.openTicketsCount,
            formatDate(o.createdAt),
            o.lastActivityAt && formatDate(o.lastActivityAt),
          ]}
        />
      </div>
      {rows.length ? (
        <Table
          cols="minmax(220px,1fr) 120px 104px 94px 104px 80px 90px 118px 140px"
          minWidth={1160}
          head={["Название", "Тип", "Статус", "Учащихся", "Сотрудников", "Филиалов", "Тикеты", "Подключена", "Последний вход"]}
          sortKeys={["name", "type", "status", "learners", "employees", "branches", "tickets", "created", "activity"]}
          sort={sort}
          onSort={(s) => f.set({ sort: s })}
        >
          {rows.map((o) => {
            const stale = isStale(o);
            return (
              <Row key={o.id} onClick={() => navigate(routes.org(o.id))} className={stale ? "bg-warn-row" : undefined}>
                <span className="flex min-w-0 items-center gap-2">
                  {o.logo ? <img src={o.logo} alt="" className="size-[22px] shrink-0 rounded-md object-cover" /> : <OrgMark short={orgMark(o)} size={22} />}
                  <Cell className="font-medium" title={o.legalName || o.name}>
                    {o.name}
                  </Cell>
                  <OrgCategoryPill category={o.category} />
                </span>
                <span className="text-xs text-neutral-500">{o.typeLabel}</span>
                <span>
                  <OrgStatusPill status={o.status} />
                </span>
                <Num>{formatInt(o.learnersCount)}</Num>
                <Num className="text-neutral-500">{formatInt(o.employeesCount)}</Num>
                <Num className="text-neutral-500">{o.branchesCount}</Num>
                <Num className={o.openTicketsCount ? "font-semibold text-red-600" : "text-neutral-400"}>{o.openTicketsCount || "—"}</Num>
                <span className="text-xs text-neutral-500">{formatDate(o.createdAt)}</span>
                <span className={cn("flex items-center gap-[5px] text-xs", stale ? "font-medium text-warn" : "text-neutral-500")}>
                  <Icon name={stale ? "zzz" : "point"} size={14} />
                  {formatAgo(o.lastActivityAt)}
                </span>
              </Row>
            );
          })}
        </Table>
      ) : (
        <div className="rounded-xl border border-neutral-200">
          <EmptyState icon="building" title={orgs.length ? "По фильтрам ничего не найдено" : "Организаций пока нет"} />
        </div>
      )}
      <p className="m-0 text-xs text-neutral-400">
        «Последний вход» — самый свежий вход среди участников организации. Жёлтым отмечены активные клиенты, где никто не входил {STALE_DAYS} дней и больше.
      </p>
    </div>
  );
}
