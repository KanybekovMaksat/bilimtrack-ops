import { useState } from "react";
import { DEVICE_LABEL, PORTAL_LABEL, type AnalyticsFilters, type Device, type Portal } from "@/entities/analytics";
import { useOrganizationsSoft } from "@/entities/organization";
import { formatDayMonth, isoDate, useUrlFilters } from "@/shared/lib";
import { FilterChip, FilterSelect, PageHeader, Segmented, Tabs, TextInput } from "@/shared/ui";
import { AchievementsReportView, ActivityOverview, BreakdownCards, FeaturesReport, OrgActivityTable, PagesTable, RetentionReport, TimeReport } from "@/widgets/activity-report";

const TABS = [
  { key: "overview", label: "Обзор" },
  { key: "pages", label: "Страницы и устройства" },
  { key: "time", label: "Время заходов" },
  { key: "orgs", label: "Организации" },
  { key: "retention", label: "Удержание" },
  { key: "features", label: "Ключевые действия" },
  { key: "achievements", label: "Достижения" },
] as const;
type TabKey = (typeof TABS)[number]["key"];
const TAB_KEYS = TABS.map((t) => t.key);

const PERIODS = [
  { value: "today", label: "Сегодня", from: 0, to: 0 },
  { value: "yesterday", label: "Вчера", from: -1, to: -1 },
  { value: "7d", label: "7 дней", from: -6, to: 0 },
  { value: "30d", label: "30 дней", from: -29, to: 0 },
  { value: "90d", label: "90 дней", from: -89, to: 0 },
  { value: "custom", label: "Даты", from: 0, to: 0 },
] as const;
type Period = (typeof PERIODS)[number]["value"];

const PORTALS = Object.keys(PORTAL_LABEL) as Portal[];
const DEVICES = Object.keys(DEVICE_LABEL) as Device[];

export function AnalyticsPage() {
  const f = useUrlFilters();
  const orgs = useOrganizationsSoft().data ?? [];
  const [today] = useState(() => isoDate());
  const tab: TabKey = f.oneOf("tab", TAB_KEYS) ?? "overview";
  const period: Period = f.oneOf("period", PERIODS.map((p) => p.value)) ?? "7d";
  const preset = PERIODS.find((p) => p.value === period)!;

  const dateFrom = period === "custom" ? (f.get("from") ?? isoDate(today, -6)) : isoDate(today, preset.from);
  const dateTo = period === "custom" ? (f.get("to") ?? today) : isoDate(today, preset.to);
  const filters: AnalyticsFilters = {
    dateFrom,
    dateTo,
    organizationId: f.num("org"),
    portal: f.oneOf("portal", PORTALS),
    device: f.oneOf("device", DEVICES),
    includeBeta: f.flag("beta") || undefined,
  };

  const range = dateFrom === dateTo ? formatDayMonth(dateFrom) : `${formatDayMonth(dateFrom)} — ${formatDayMonth(dateTo)}`;

  return (
    <div className="flex max-w-[1280px] flex-col gap-4">
      <PageHeader title="Аналитика" subtitle={`активность в клиентском приложении · ${range}`} />

      <div className="flex flex-wrap items-center gap-2">
        <Segmented
          options={PERIODS.map((p) => ({ value: p.value, label: p.label }))}
          value={period}
          onChange={(v) => f.set({ period: v === "7d" ? undefined : v, from: v === "custom" ? dateFrom : undefined, to: v === "custom" ? dateTo : undefined })}
        />
        {period === "custom" && (
          <>
            <TextInput look="plain" inputSize="sm" type="date" className="w-[150px]" value={dateFrom} max={dateTo} onChange={(e) => f.set({ from: e.target.value })} title="С даты" />
            <TextInput look="plain" inputSize="sm" type="date" className="w-[150px]" value={dateTo} min={dateFrom} max={today} onChange={(e) => f.set({ to: e.target.value })} title="По дату" />
          </>
        )}
        <FilterSelect
          label="Организация"
          allLabel="Все клиенты"
          searchPlaceholder="Найти организацию"
          menuWidth={320}
          value={filters.organizationId ? String(filters.organizationId) : undefined}
          onChange={(v) => f.set({ org: v })}
          options={orgs.map((o) => ({ value: String(o.id), label: o.name }))}
        />
        <FilterSelect label="Портал" allLabel="Все порталы" value={filters.portal} onChange={(v) => f.set({ portal: v })} options={PORTALS.map((p) => ({ value: p, label: PORTAL_LABEL[p] }))} />
        <FilterSelect label="Устройство" allLabel="Все устройства" value={filters.device} onChange={(v) => f.set({ device: v })} options={DEVICES.map((d) => ({ value: d, label: DEVICE_LABEL[d] }))} />
        {!filters.organizationId && (
          <FilterChip tone={filters.includeBeta ? "active" : "default"} icon="flask" label="С beta-организациями" onClick={() => f.set({ beta: !filters.includeBeta })} />
        )}
      </div>

      <Tabs items={TABS.map((t) => ({ ...t }))} value={tab} onChange={(k) => f.set({ tab: k === "overview" ? undefined : k })} />

      {tab === "overview" && <ActivityOverview filters={filters} />}
      {tab === "pages" && (
        <div className="flex flex-col gap-4">
          <BreakdownCards filters={filters} />
          <PagesTable filters={filters} />
        </div>
      )}
      {tab === "time" && <TimeReport filters={filters} />}
      {tab === "orgs" && (
        <div className="flex flex-col gap-3">
          <div className="text-xs text-neutral-500">
            «За 7 дней» и риск считаются по последней неделе периода. Риск: никто не заходил 7 дней, активность упала вдвое к прошлой неделе или за 30 дней заходили меньше 30% участников.
          </div>
          <OrgActivityTable filters={filters} />
        </div>
      )}
      {tab === "retention" && <RetentionReport filters={filters} />}
      {tab === "features" && <FeaturesReport filters={filters} />}
      {tab === "achievements" && <AchievementsReportView filters={filters} />}
    </div>
  );
}
