import { useState } from "react";
import { Link } from "react-router";
import { JOURNAL_PAGE, useAccessLogs, useJournalChoices, type AccessEntry, type AccessFilters } from "@/entities/journal";
import { routes } from "@/shared/config";
import { formatDateTimeShort, useDebouncedEffect } from "@/shared/lib";
import { Callout, Cell, EmptyState, FilterChip, Num, PageHeader, Pager, Pill, Row, SearchInput, SelectInput, Table, TextInput } from "@/shared/ui";

const EVENT_TONE: Record<AccessEntry["eventType"], "success" | "danger" | "neutral" | "info"> = {
  login_success: "success",
  login_failed: "danger",
  logout: "neutral",
  password_changed: "info",
};

const REASONS: Record<string, string> = {
  invalid_credentials: "неверный логин или пароль",
  account_locked: "заблокирован после неудачных попыток",
};

export function LoginsPage() {
  const choices = useJournalChoices();
  const [filters, setFilters] = useState<AccessFilters>({});
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const logs = useAccessLogs(filters, page);
  const update = (patch: Partial<AccessFilters>) => {
    setFilters((f) => ({ ...f, ...patch }));
    setPage(1);
  };
  useDebouncedEffect(search.trim(), 350, (q) => {
    if ((filters.q ?? "") !== q) update({ q: q || undefined });
  });

  const rows = logs.data?.rows ?? [];

  return (
    <div className="flex max-w-[1240px] flex-col gap-4">
      <PageHeader title="Логи входов" subtitle="входы, выходы и смены пароля по всей платформе — для разбора «не пускает»" />
      <div className="flex flex-wrap items-center gap-2">
        <SearchInput placeholder="Логин, имя или IP" value={search} onChange={setSearch} />
        <SelectInput
          className="w-[200px]"
          placeholder="Все события"
          value={filters.eventType ?? ""}
          onChange={(e) => update({ eventType: e.target.value || undefined, failedOnly: undefined })}
          options={choices.data?.eventTypes ?? []}
        />
        <TextInput look="plain" inputSize="sm" type="date" className="w-[150px]" value={filters.dateFrom ?? ""} onChange={(e) => update({ dateFrom: e.target.value || undefined })} title="С даты" />
        <TextInput look="plain" inputSize="sm" type="date" className="w-[150px]" value={filters.dateTo ?? ""} onChange={(e) => update({ dateTo: e.target.value || undefined })} title="По дату" />
        <FilterChip tone={filters.failedOnly ? "danger" : "default"} icon="alert-circle" label="Только неудачные" onClick={() => update({ failedOnly: !filters.failedOnly, eventType: undefined })} />
        <FilterChip tone={filters.operatorsOnly ? "active" : "default"} icon="shield-lock" label="Только команда" onClick={() => update({ operatorsOnly: !filters.operatorsOnly })} />
      </div>
      {logs.error ? (
        <Callout tone="danger" icon="alert-triangle">
          Журнал не загрузился: {logs.error.message}
        </Callout>
      ) : (
        <Table
          cols="128px minmax(170px,1fr) 190px minmax(150px,0.8fr) 130px minmax(170px,1fr)"
          minWidth={1080}
          head={["Время", "Кто", "Событие", "Организация", "IP", "Устройство"]}
        >
          {logs.isLoading && <div className="h-40 animate-pulse bg-neutral-50" />}
          {!logs.isLoading && !rows.length && <EmptyState icon="login" title="Записей нет" description="Измените фильтры или период." />}
          {rows.map((l) => (
            <Row key={l.id} className={l.eventType === "login_failed" ? "bg-red-50/40" : undefined}>
              <span className="text-xs text-neutral-500">{formatDateTimeShort(l.createdAt)}</span>
              <span className="min-w-0">
                {l.username ? (
                  <Link to={routes.account(l.username)} className="block truncate font-num text-xs">
                    {l.username}
                  </Link>
                ) : (
                  <span className="text-xs text-neutral-400">—</span>
                )}
                {l.actorName && <Cell className="block text-[11px] text-neutral-400">{l.actorName}</Cell>}
              </span>
              <span className="flex min-w-0 flex-col items-start gap-0.5">
                <Pill size="sm" tone={EVENT_TONE[l.eventType] ?? "neutral"}>
                  {l.eventTypeLabel}
                </Pill>
                {l.failureReason && <Cell className="text-[11px] text-neutral-400">{REASONS[l.failureReason] ?? l.failureReason}</Cell>}
              </span>
              <Cell className="text-xs text-neutral-500">{l.organization?.name ?? "—"}</Cell>
              <Num className="text-neutral-700">{l.ipAddress ?? "—"}</Num>
              <Cell className="text-xs text-neutral-500">
                {[l.browser, l.os, l.deviceType].filter(Boolean).join(" · ") || "—"}
                {(l.city || l.country) && ` · ${[l.city, l.country].filter(Boolean).join(", ")}`}
              </Cell>
            </Row>
          ))}
        </Table>
      )}
      <Pager page={page} pageSize={JOURNAL_PAGE} total={logs.data?.count ?? 0} onPage={setPage} />
    </div>
  );
}
