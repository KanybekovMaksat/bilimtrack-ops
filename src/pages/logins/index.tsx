import { useState } from "react";
import { useLoginLog } from "@/entities/platform";
import { FilterChip, Num, PageHeader, Pill, Row, SearchInput, Table } from "@/shared/ui";

export function LoginsPage() {
  const log = useLoginLog();
  const [failedOnly, setFailedOnly] = useState(false);
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const rows = log.filter((l) => (!failedOnly || !l.ok) && (!q || `${l.login} ${l.ip}`.includes(q)));

  return (
    <div className="flex max-w-[1080px] flex-col gap-4">
      <PageHeader title="Логи входов" subtitle="для разбора жалоб «не пускает»" />
      <div className="flex gap-2">
        <SearchInput placeholder="Логин или IP" value={query} onChange={setQuery} />
        <FilterChip tone="danger" icon="alert-circle" label={`Только неудачные · ${log.filter((l) => !l.ok).length}`} onClick={() => setFailedOnly((v) => !v)} />
      </div>
      <Table cols="130px 170px 220px 140px minmax(180px,1fr)" minWidth={940} head={["Время", "Логин", "Результат", "IP", "Устройство"]}>
        {rows.map((l, i) => (
          <Row key={i} className={l.ok ? undefined : "bg-[#fffdfd]"}>
            <span className="text-xs text-neutral-500">{l.time}</span>
            <Num>{l.login}</Num>
            <span className="flex items-center gap-2">
              <Pill tone={l.ok ? "success" : "danger"}>{l.ok ? "Успешно" : "Неудача"}</Pill>
              <span className="text-xs text-neutral-400">{l.reason}</span>
            </span>
            <Num className="text-neutral-700">{l.ip}</Num>
            <span className="text-xs text-neutral-500">{l.device}</span>
          </Row>
        ))}
      </Table>
    </div>
  );
}
