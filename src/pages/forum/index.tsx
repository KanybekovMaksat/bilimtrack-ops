import { useState } from "react";
import {
  CATEGORY_LABEL,
  FORUM_PAGE,
  ForumStatePill,
  POST_TYPE_LABEL,
  formatDuration,
  useForumAccount,
  useForumPublications,
  type ForumPostType,
  type ForumPublication,
} from "@/entities/forum-publication";
import { useCan } from "@/entities/session";
import { DeleteForumPublicationModal, EditForumPublicationModal, PublishForumPostModal } from "@/features/manage-forum-publication";
import { cn, formatDateTimeShort, formatInt, useUrlFilters, useUrlSearch } from "@/shared/lib";
import { Button, Callout, Card, EmptyState, FilterReset, FilterSelect, Icon, PageHeader, Pager, Pill, SearchInput, Tabs } from "@/shared/ui";

type Tab = ForumPostType | "all";
const TABS: Tab[] = ["all", "news", "standard"];

function PublicationCard({ post, canEdit, onEdit, onDelete }: { post: ForumPublication; canEdit: boolean; onEdit: () => void; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const long = post.text.length > 420;
  const video = post.videos[0];
  return (
    <Card className="flex flex-col gap-2.5 p-4">
      <div className="flex items-center gap-2">
        <Pill size="sm" tone={post.postType === "news" ? "info" : "neutral"} icon={post.postType === "news" ? "speakerphone" : "message-circle"}>
          {POST_TYPE_LABEL[post.postType]}
        </Pill>
        <span className="text-sm font-medium">{post.organization.name}</span>
        {post.isPinned && (
          <Pill size="sm" tone="purple" icon="pin">
            Закреплено
          </Pill>
        )}
        <div className="flex-1" />
        <ForumStatePill state={post.state} />
      </div>
      <div className="text-[11px] text-neutral-400">
        {formatDateTimeShort(post.publishedAt)} · {CATEGORY_LABEL[post.category] ?? post.category} · #{post.id}
      </div>
      {post.title && <div className="text-[15px] font-semibold">{post.title}</div>}
      {post.text && <div className={cn("text-[13px] leading-5 whitespace-pre-line text-neutral-800", long && !expanded && "line-clamp-6")}>{post.text}</div>}
      {long && (
        <button onClick={() => setExpanded((v) => !v)} className="self-start border-0 bg-transparent p-0 text-xs text-brand">
          {expanded ? "Свернуть" : "Показать полностью"}
        </button>
      )}
      {post.images.length > 0 && (
        <div className="grid grid-cols-5 gap-2">
          {post.images.map((img) => (
            <a key={img.id} href={img.url} target="_blank" rel="noreferrer">
              <img src={img.url} alt="" loading="lazy" className="aspect-square w-full rounded-lg object-cover" />
            </a>
          ))}
        </div>
      )}
      {video && (
        <div className="flex flex-col gap-1">
          <video src={video.url} poster={video.posterUrl ?? undefined} controls preload="none" className="aspect-video w-full max-w-[520px] rounded-lg bg-neutral-900 object-contain" />
          <div className="text-[11px] text-neutral-400">
            {formatDuration(video.durationSeconds)} · {video.isProcessed ? "пережато в 720p" : "пережимается в 720p…"}
          </div>
        </div>
      )}
      <div className="flex items-center gap-3 border-t border-neutral-100 pt-2.5 text-xs text-neutral-500">
        <span className="flex items-center gap-1">
          <Icon name="eye" size={14} /> {formatInt(post.viewsCount)}
        </span>
        {post.postType === "standard" && (
          <span className="flex items-center gap-1">
            <Icon name="heart" size={14} /> {formatInt(post.likesCount)}
          </span>
        )}
        <span className="flex items-center gap-1">
          <Icon name="message-circle" size={14} /> {formatInt(post.commentsCount)}
        </span>
        <span className="flex items-center gap-1">
          <Icon name="send" size={14} /> {formatInt(post.sharesCount)}
        </span>
        <div className="flex-1" />
        {canEdit && (
          <>
            <Button size="sm" icon="pencil" onClick={onEdit}>
              Изменить
            </Button>
            <Button size="sm" variant="dangerOutline" icon="trash" onClick={onDelete}>
              Удалить
            </Button>
          </>
        )}
      </div>
    </Card>
  );
}

export function ForumPage() {
  const can = useCan();
  const canEdit = can("content");
  const f = useUrlFilters();
  const [query, setQuery] = useUrlSearch(f, 300);
  const tab = f.oneOf("type", TABS) ?? "all";
  const page = f.num("page") ?? 1;
  const account = useForumAccount();
  const organizations = account.data?.organizations ?? [];
  const orgId = f.get("org");
  const list = useForumPublications({
    organizationId: orgId ? Number(orgId) : undefined,
    postType: tab === "all" ? undefined : tab,
    q: f.get("q") || undefined,
    page,
  });
  const rows = list.data?.rows ?? [];
  const [publishing, setPublishing] = useState(false);
  const [editing, setEditing] = useState<ForumPublication | null>(null);
  const [deleting, setDeleting] = useState<ForumPublication | null>(null);

  return (
    <div className="flex max-w-[900px] flex-col gap-4">
      <PageHeader
        title="Форум"
        subtitle={account.data ? `публикации от @${account.data.account.username} в форумах организаций` : "публикации от официального аккаунта"}
        actions={
          canEdit && (
            <Button variant="primary" icon="plus" disabled={!account.data} onClick={() => setPublishing(true)}>
              Опубликовать
            </Button>
          )
        }
      />
      {account.error && <Callout tone="danger">Официальный аккаунт недоступен: {account.error.message}</Callout>}
      <Tabs<Tab>
        value={tab}
        onChange={(k) => f.set({ type: k === "all" ? undefined : k })}
        items={[
          { key: "all", label: "Все" },
          { key: "news", label: "Новости" },
          { key: "standard", label: "Посты" },
        ]}
      />
      <div className="flex flex-wrap items-center gap-2">
        <SearchInput placeholder="Заголовок или текст" value={query} onChange={setQuery} />
        <FilterSelect<string>
          label="Организация"
          allLabel="Все организации"
          value={orgId}
          onChange={(v) => f.set({ org: v })}
          options={organizations.map((o) => ({ value: String(o.id), label: o.name }))}
        />
        <FilterReset filters={f} keys={["q", "org", "type"]} />
      </div>
      {list.isLoading && <div className="h-40 animate-pulse rounded-2xl bg-neutral-50" />}
      {list.error && <Callout tone="danger">Публикации не загрузились: {list.error.message}</Callout>}
      {!list.isLoading && !list.error && !rows.length && (
        <EmptyState
          dashed
          icon="speakerphone"
          title="Публикаций пока нет"
          description={canEdit ? "Нажмите «Опубликовать», чтобы написать новость или пост от имени Bilimtrack." : "Измените фильтры или поиск."}
        />
      )}
      {rows.map((post) => (
        <PublicationCard key={post.id} post={post} canEdit={canEdit} onEdit={() => setEditing(post)} onDelete={() => setDeleting(post)} />
      ))}
      <Pager page={page} pageSize={FORUM_PAGE} total={list.data?.count ?? 0} onPage={(p) => f.set({ page: p })} />

      {publishing && <PublishForumPostModal onClose={() => setPublishing(false)} />}
      {editing && <EditForumPublicationModal post={editing} onClose={() => setEditing(null)} />}
      {deleting && <DeleteForumPublicationModal post={deleting} onClose={() => setDeleting(null)} />}
    </div>
  );
}
