import { useState } from "react";
import { useNavigate } from "react-router";
import { ORG_TOTAL, OrgStatusPill, useOrganizations } from "@/entities/organization";
import { routes } from "@/shared/config";
import { Button, Cell, FilterChip, Icon, Num, OrgMark, PageHeader, Row, SearchInput, Table } from "@/shared/ui";

export function OrgsPage() {
  const orgs = useOrganizations();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [staleOnly, setStaleOnly] = useState(false);
  const staleCount = orgs.filter((o) => o.stale).length;
  const rows = orgs.filter((o) => (!staleOnly || o.stale) && o.name.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Организации"
        subtitle={`${ORG_TOTAL} клиента платформы`}
        actions={
          <Button variant="primary" icon="plus" onClick={() => navigate(routes.orgNew)}>
            Новая организация
          </Button>
        }
      />
      <div className="flex items-center gap-2">
        <SearchInput placeholder="Название организации" value={query} onChange={setQuery} />
        {["Тип", "Статус", "Размер"].map((f) => (
          <FilterChip key={f} label={f} />
        ))}
        <FilterChip tone="warn" icon="zzz" label={`Без активности 14+ дней · ${staleCount}`} onClick={() => setStaleOnly((v) => !v)} />
      </div>
      <Table
        cols="minmax(200px,1fr) 112px 100px 94px 108px 80px 108px 136px"
        minWidth={1080}
        head={["Название", "Тип", "Статус", "Учащихся", "Сотрудников", "Филиалов", "Подключена", "Последняя активность"]}
      >
        {rows.map((o) => (
          <Row key={o.slug} onClick={() => navigate(routes.org(o.slug))} className={o.stale ? "bg-warn-row" : undefined}>
            <span className="flex min-w-0 items-center gap-2">
              <OrgMark short={o.short} size={22} />
              <Cell className="font-medium">{o.name}</Cell>
            </span>
            <span className="text-xs text-neutral-500">{o.type}</span>
            <span>
              <OrgStatusPill status={o.status} />
            </span>
            <Num>{o.students}</Num>
            <Num className="text-neutral-500">{o.staff}</Num>
            <Num className="text-neutral-500">{o.branches}</Num>
            <span className="text-xs text-neutral-500">{o.since}</span>
            <span className={`flex items-center gap-[5px] text-xs ${o.stale ? "font-medium text-warn" : "text-neutral-500"}`}>
              <Icon name={o.stale ? "zzz" : "point"} size={14} />
              {o.lastActivity}
            </span>
          </Row>
        ))}
      </Table>
    </div>
  );
}
