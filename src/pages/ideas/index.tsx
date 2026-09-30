import { useState } from "react";
import { Link } from "react-router";
import {
  IDEA_STATUSES,
  ideaStatusLabel,
  ideaStatusTone,
  useIdeas,
  useUpdateIdeaStatus,
  type Idea,
  type IdeaStatus,
} from "@/entities/idea";
import { routes } from "@/shared/config";
import { cn, formatDateTimeFull, formatRelative, initialsOf, orgShort, useUrlFilters, useUrlSearch } from "@/shared/lib";
import { Avatar, Button, Card, EmptyState, ErrorNote, FilterReset, FilterSelect, Icon, OrgMark, PageHeader, Pill, SearchInput, Tabs } from "@/shared/ui";

type TabKey = IdeaStatus | "all";

export function IdeasPage() {
  const ideas = useIdeas();
  const update = useUpdateIdeaStatus();
  const f = useUrlFilters();
  const [query, setQuery] = useUrlSearch(f, 250);
  const tab: TabKey = f.oneOf<TabKey>("tab", [...IDEA_STATUSES, "all"]) ?? "new";
  const orgId = f.num("org") ?? null;
  const [preview, setPreview] = useState<string | null>(null);

  const orgs = [...new Map(ideas.filter((i) => i.org).map((i) => [i.org!.id, i.org!])).values()].sort((a, b) => a.name.localeCompare(b.name));
  const q = query.trim().toLowerCase();
  const inScope = ideas.filter(
    (i) => (orgId === null || i.org?.id === orgId) && (!q || `${i.text} ${i.author?.name ?? ""} ${i.author?.username ?? ""}`.toLowerCase().includes(q)),
  );
  const rows = inScope.filter((i) => tab === "all" || i.status === tab);
  const count = (s: TabKey) => (s === "all" ? inScope.length : inScope.filter((i) => i.status === s).length);

  return (
    <div className="flex max-w-[880px] flex-col gap-4">
      <PageHeader title="Идеи" subtitle="предложения пользователей по продукту · из всех организаций" />
      <Tabs
        value={tab}
        onChange={(k) => f.set({ tab: k === "new" ? undefined : k })}
        items={[...IDEA_STATUSES.map((s) => ({ key: s as TabKey, label: ideaStatusLabel[s], count: count(s) })), { key: "all", label: "Все", count: count("all") }]}
      />
      <div className="flex flex-wrap items-center gap-2">
        <SearchInput placeholder="Текст идеи или автор" value={query} onChange={setQuery} width={260} />
        <FilterSelect
          label="Организация"
          allLabel={`Все организации · ${orgs.length}`}
          searchPlaceholder="Название организации"
          menuWidth={340}
          value={orgId === null ? undefined : String(orgId)}
          onChange={(v) => f.set({ org: v })}
          options={orgs.map((o) => ({ value: String(o.id), label: o.name }))}
        />
        <FilterReset filters={f} keys={["q", "org"]} />
        <div className="flex-1" />
        <span className="text-xs text-neutral-400">Новые сверху · обновляется раз в минуту</span>
      </div>
      <ErrorNote error={update.error} prefix="Статус не сохранён" />

      {rows.length ? (
        rows.map((idea) => (
          <IdeaCard key={idea.id} idea={idea} onStatus={(status) => update.mutate({ id: idea.id, status })} onPreview={setPreview} />
        ))
      ) : (
        <Card>
          <EmptyState
            icon="bulb"
            title={ideas.length ? "Здесь пусто" : "Идей пока нет"}
            description={ideas.length ? "Смените вкладку или сбросьте фильтры." : "Пользователи отправляют идеи из приложения: раздел «Предложить идею»."}
          />
        </Card>
      )}

      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6" onClick={() => setPreview(null)}>
          <img src={preview} alt="Вложение" className="max-h-[90vh] max-w-[90vw] rounded-lg shadow-2xl" />
        </div>
      )}
    </div>
  );
}

function IdeaCard({ idea, onStatus, onPreview }: { idea: Idea; onStatus: (s: IdeaStatus) => void; onPreview: (url: string) => void }) {
  const authorName = idea.author?.name ?? "Удалённый аккаунт";
  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex items-center gap-2.5">
        {idea.author?.photo ? (
          <img src={idea.author.photo} alt="" className="size-8 shrink-0 rounded-full object-cover" />
        ) : (
          <Avatar initials={initialsOf(authorName)} size={32} className="text-[11px]" />
        )}
        <div className="min-w-0 flex-1">
          {idea.author ? (
            <Link to={routes.account(idea.author.username)} className="text-[13px] font-medium text-brand">
              {authorName}
            </Link>
          ) : (
            <span className="text-[13px] font-medium text-neutral-500">{authorName}</span>
          )}
          <div className="flex items-center gap-1.5 text-[11px] text-neutral-400">
            {idea.author && <span className="font-num">{idea.author.username}</span>}
            {idea.org && (
              <>
                <span>·</span>
                <span className="inline-flex items-center gap-[5px]">
                  <OrgMark short={orgShort(idea.org.name)} size={16} />
                  <Link to={routes.org(String(idea.org.id))} className="text-neutral-500 hover:text-brand">
                    {idea.org.name}
                  </Link>
                </span>
              </>
            )}
          </div>
        </div>
        <Pill tone={ideaStatusTone[idea.status]}>{ideaStatusLabel[idea.status]}</Pill>
        <span className="text-[11px] text-neutral-400" title={formatDateTimeFull(idea.createdAt)}>
          {formatRelative(idea.createdAt)}
        </span>
      </div>

      <div className="text-sm leading-[21px] whitespace-pre-line text-neutral-800">{idea.text}</div>

      {idea.attachments.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {idea.attachments.map((a) =>
            a.isImage ? (
              <button
                key={a.id}
                onClick={() => onPreview(a.url)}
                className="h-16 w-24 overflow-hidden rounded-[10px] border border-neutral-200 bg-neutral-100 p-0 hover:border-brand"
                title={a.name}
              >
                <img src={a.url} alt={a.name} className="h-full w-full object-cover" />
              </button>
            ) : (
              <a
                key={a.id}
                href={a.url}
                target="_blank"
                rel="noreferrer"
                className="flex h-16 max-w-[220px] items-center gap-2 rounded-[10px] border border-neutral-200 px-3 text-xs text-neutral-700 hover:border-brand"
              >
                <Icon name="paperclip" size={16} className="text-neutral-400" />
                <span className="truncate">{a.name}</span>
              </a>
            ),
          )}
        </div>
      )}

      <div className="flex items-center gap-1.5 border-t border-neutral-50 pt-2.5">
        {IDEA_STATUSES.map((s) => (
          <Button
            key={s}
            size="xs"
            variant={s === idea.status ? "primary" : "outline"}
            className={cn(s !== idea.status && "font-normal")}
            disabled={s === idea.status}
            onClick={() => onStatus(s)}
          >
            {s === "new" ? "Вернуть в новые" : s === "in_progress" ? "Взять в работу" : "Отклонить"}
          </Button>
        ))}
      </div>
    </Card>
  );
}
