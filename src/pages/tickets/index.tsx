import { useState } from "react";
import { useOrganizationsSoft } from "@/entities/organization";
import { useCan } from "@/entities/session";
import { operatorOptions, useOperators } from "@/entities/task";
import {
  CATEGORY,
  PRIORITY,
  SLA_POLICY,
  SOURCE,
  STATUS,
  TICKETS_PAGE_SIZE,
  exportTickets,
  useTicketList,
  useTicketSummary,
  type SlaState,
  type Ticket,
  type TicketFilters,
  type TicketStatus,
} from "@/entities/ticket";
import { ManageReplyTemplatesModal } from "@/features/manage-reply-templates";
import { cn, formatDateTimeFull, plural, useUrlFilters, useUrlSearch } from "@/shared/lib";
import {
  Button,
  Callout,
  EmptyState,
  ExportButton,
  FilterChip,
  FilterMultiSelect,
  FilterReset,
  FilterSelect,
  Icon,
  type IconName,
  PageHeader,
  Pager,
  SearchInput,
  Tabs,
} from "@/shared/ui";
import { TicketsTable } from "@/widgets/tickets-table";

const TABS = ["open", "in_progress", "done", "all"] as const;
type TabKey = (typeof TABS)[number];

const TAB_STATUS: Record<TabKey, TicketStatus[] | undefined> = {
  open: ["open"],
  in_progress: ["in_progress"],
  done: ["resolved", "closed"],
  all: undefined,
};

const PRIORITIES = Object.keys(PRIORITY) as Ticket["priority"][];
const CATEGORIES = Object.keys(CATEGORY) as Ticket["category"][];
const SOURCES = Object.keys(SOURCE) as Ticket["source"][];
const SLA_FILTERS = ["over", "soon", "ok"] as const;
type SlaFilter = Exclude<SlaState, "done">;
const FILTER_KEYS = ["q", "priority", "category", "source", "assignee", "org", "sla", "unread", "awaiting"];

const SLA_STRIP: { key: SlaFilter; l: string; icon: IconName; c: string; bg: string }[] = [
  { key: "over", l: "просрочено", icon: "alarm", c: "var(--color-red-500)", bg: "var(--color-red-50)" },
  { key: "soon", l: "истекает в течение часа", icon: "clock", c: "var(--color-warn)", bg: "var(--color-amber-50)" },
  { key: "ok", l: "в норме", icon: "circle-check", c: "var(--color-green-600)", bg: "var(--color-neutral-50)" },
];

export function TicketsPage() {
  const f = useUrlFilters();
  const can = useCan();
  const [query, setQuery] = useUrlSearch(f);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const orgs = useOrganizationsSoft().data ?? [];
  const operators = useOperators().data ?? [];

  const tab = f.oneOf("tab", TABS) ?? "open";
  const sla = f.oneOf("sla", SLA_FILTERS);
  const unread = f.flag("unread");
  const awaiting = f.flag("awaiting");
  const q = f.get("q") ?? "";
  const page = f.num("page") ?? 1;

  // Everything the counters depend on: tabs, SLA strip and the «unread» chip split this selection further.
  const scope: TicketFilters = {
    q: q.length >= 2 ? q : undefined,
    priority: f.list("priority", PRIORITIES),
    category: f.list("category", CATEGORIES),
    source: f.list("source", SOURCES),
    assignee: f.get("assignee"),
    organizationId: f.get("org"),
  };
  const filters: TicketFilters = { ...scope, status: TAB_STATUS[tab], sla, unread, awaiting, ordering: f.get("sort") };

  const list = useTicketList({ ...filters, page });
  const summary = useTicketSummary(scope).data;
  const rows = list.data?.rows ?? [];
  const total = list.data?.count ?? 0;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Тикеты"
        subtitle="единый инбокс: обращения из всех учреждений"
        actions={
          can("support") && (
            <Button icon="template" onClick={() => setTemplatesOpen(true)}>
              Шаблоны ответов
            </Button>
          )
        }
      />
      <Tabs
        value={tab}
        onChange={(k) => f.set({ tab: k === "open" ? undefined : k })}
        items={[
          { key: "open", label: "Открытые", count: summary?.open },
          { key: "in_progress", label: "В работе", count: summary?.inProgress },
          { key: "done", label: "Решённые", count: summary?.done },
          { key: "all", label: "Все", count: summary?.all },
        ]}
      />
      <div className="flex flex-wrap items-center gap-2">
        <SearchInput width={260} placeholder="Тема, номер, автор, контакт, логин" value={query} onChange={setQuery} />
        <FilterChip
          icon="mail"
          tone={unread ? "active" : "default"}
          label={`Непрочитанные${summary ? ` · ${summary.unread}` : ""}`}
          onClick={() => f.set(unread ? { unread: false } : { unread: true, tab: "all" })}
        />
        <FilterChip
          icon="message"
          tone={awaiting ? "warn" : "default"}
          label={`Ждут ответа${summary ? ` · ${summary.awaiting}` : ""}`}
          onClick={() => f.set(awaiting ? { awaiting: false } : { awaiting: true, tab: "all" })}
        />
        <FilterSelect
          label="Исполнитель"
          allLabel="Все исполнители"
          searchPlaceholder="Имя или логин"
          menuWidth={280}
          value={scope.assignee}
          onChange={(v) => f.set({ assignee: v })}
          options={[
            { value: "me", label: `Мои${summary ? ` · ${summary.mine} в работе` : ""}`, icon: "user" },
            { value: "none", label: "Без исполнителя", icon: "user-search" },
            ...operatorOptions(operators),
          ]}
        />
        <FilterMultiSelect
          label="Приоритет"
          allLabel="Любой приоритет"
          values={scope.priority ?? []}
          onChange={(v) => f.set({ priority: v })}
          options={PRIORITIES.map((p) => ({ value: p, label: PRIORITY[p].label }))}
        />
        <FilterMultiSelect
          label="Категория"
          allLabel="Все категории"
          values={scope.category ?? []}
          onChange={(v) => f.set({ category: v })}
          options={CATEGORIES.map((c) => ({ value: c, label: CATEGORY[c] }))}
        />
        <FilterMultiSelect
          label="Источник"
          allLabel="Все источники"
          values={scope.source ?? []}
          onChange={(v) => f.set({ source: v })}
          options={SOURCES.map((s) => ({ value: s, label: SOURCE[s].label, icon: SOURCE[s].icon, iconColor: SOURCE[s].color }))}
        />
        <FilterSelect
          label="Организация"
          allLabel="Все организации"
          searchPlaceholder="Название организации"
          menuWidth={340}
          value={scope.organizationId}
          onChange={(v) => f.set({ org: v })}
          options={[{ value: "none", label: "Без организации (гости)", icon: "user-search" }, ...orgs.map((o) => ({ value: String(o.id), label: o.name }))]}
        />
        <FilterReset filters={f} keys={FILTER_KEYS} />
        <ExportButton
          filename="tickets"
          head={["Номер", "Тема", "Автор", "Контакт", "Организация", "Категория", "Приоритет", "SLA", "Источник", "Статус", "Исполнитель", "Создан", "Последнее сообщение"]}
          load={() => exportTickets(filters)}
          row={(t) => [
            t.number,
            t.subject,
            t.author,
            t.contact,
            t.organization?.name,
            CATEGORY[t.category] ?? t.category,
            PRIORITY[t.priority]?.label ?? t.priority,
            t.sla.label,
            SOURCE[t.source]?.label ?? t.source,
            STATUS[t.status]?.label ?? t.status,
            t.assignee?.name,
            formatDateTimeFull(t.createdAt),
            formatDateTimeFull(t.lastMessageAt),
          ]}
        />
        <div className="flex-1" />
        <span className="text-[13px] text-neutral-500">
          {list.isFetching && !list.data ? "Загрузка…" : `${total} ${plural(total, ["тикет", "тикета", "тикетов"])}`}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {SLA_STRIP.map((x) => (
          // SLA is counted over tickets in work on every tab, so the filter opens «Все» to show exactly those.
          <button
            key={x.key}
            type="button"
            aria-pressed={sla === x.key}
            title={sla === x.key ? "Снять фильтр" : "Показать только эти тикеты"}
            onClick={() => f.set(sla === x.key ? { sla: undefined } : { sla: x.key, tab: "all" })}
            className={cn("flex items-center gap-2 rounded-xl border px-3 py-2 text-[13px]", sla === x.key ? "border-neutral-700" : "border-transparent hover:border-neutral-300")}
            style={{ background: x.bg }}
          >
            <Icon name={x.icon} size={16} style={{ color: x.c }} />
            <span className="font-num font-semibold">{summary?.sla[x.key] ?? "—"}</span>
            <span className="text-neutral-600">{x.l}</span>
          </button>
        ))}
        <div className="flex-1" />
        <span className="text-xs text-neutral-400">{SLA_POLICY}</span>
      </div>
      {q.length === 1 && <div className="text-xs text-neutral-400">Для поиска нужно минимум 2 символа.</div>}

      {list.error ? (
        <Callout tone="danger">{list.error.message}</Callout>
      ) : rows.length || list.isLoading ? (
        <TicketsTable tickets={rows} loading={list.isLoading} sort={filters.ordering} onSort={(s) => f.set({ sort: s })} />
      ) : (
        <div className="rounded-xl border border-neutral-200">
          {summary?.all || f.has(FILTER_KEYS) ? (
            <EmptyState
              icon="filter-off"
              title="По вашим фильтрам ничего не найдено"
              description="Измените вкладку, поиск или фильтры."
              action={f.has(FILTER_KEYS) && <Button onClick={() => f.clear(FILTER_KEYS)}>Сбросить фильтры</Button>}
            />
          ) : (
            <EmptyState icon="inbox-off" title="Тикетов пока нет" description="Когда клиент напишет с сайта, из панели, Telegram или через API — обращение появится здесь." />
          )}
        </div>
      )}
      {total > TICKETS_PAGE_SIZE && <Pager page={page} pageSize={TICKETS_PAGE_SIZE} total={total} onPage={(p) => f.set({ page: p })} />}

      {templatesOpen && <ManageReplyTemplatesModal onClose={() => setTemplatesOpen(false)} />}
    </div>
  );
}
