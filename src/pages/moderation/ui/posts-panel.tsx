import { useState } from "react";
import { MODERATION_PAGE, useHidePost, useModerationPosts, useRestorePost, type ModerationPost, type ModerationQuery } from "@/entities/moderation";
import { cn, formatDateTimeShort, initialsOf } from "@/shared/lib";
import { Avatar, Button, Callout, Card, EmptyState, Icon, Pager, Pill } from "@/shared/ui";
import { useFilters } from "../lib";
import { PersonLink, OrgLink, StatusPill, HideModal } from "./common";

export function PostCard({ post, onHide }: { post: ModerationPost; onHide: () => void }) {
  const f = useFilters();
  const restore = useRestorePost();
  const [expanded, setExpanded] = useState(false);
  const images = post.parts.flatMap((p) => p.images);
  const long = post.text.length > 420;
  return (
    <Card className={cn("flex flex-col gap-2.5 p-4", post.status !== "published" && "bg-neutral-50")}>
      <div className="flex items-start gap-2.5">
        <Avatar initials={initialsOf(post.author.fullName || post.author.username)} size={34} className="text-[11px]" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <PersonLink person={post.author} />
            {post.postType === "news" && (
              <Pill size="sm" tone="info" icon="speakerphone">
                Новость
              </Pill>
            )}
          </div>
          <div className="flex gap-1 text-[11px] text-neutral-400">
            <OrgLink org={post.organization} /> · {formatDateTimeShort(post.publishedAt)} · #{post.id}
          </div>
        </div>
        <StatusPill status={post.status} />
      </div>
      {post.title && <div className="text-[15px] font-semibold">{post.title}</div>}
      <div className={cn("text-[13px] leading-5 whitespace-pre-line text-neutral-800", long && !expanded && "line-clamp-6")}>{post.text || "Без текста"}</div>
      {long && (
        <button onClick={() => setExpanded((v) => !v)} className="self-start border-0 bg-transparent p-0 text-xs text-brand">
          {expanded ? "Свернуть" : "Показать полностью"}
        </button>
      )}
      {images.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {images.map((url) => (
            <a key={url} href={url} target="_blank" rel="noreferrer">
              <img src={url} alt="" loading="lazy" className="aspect-square w-full rounded-lg object-cover" />
            </a>
          ))}
        </div>
      )}
      {post.status === "hidden" && <div className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-warn">Причина скрытия: {post.hiddenReason || "не указана"}</div>}
      <div className="flex items-center gap-2 border-t border-neutral-100 pt-2.5">
        <Button size="xs" variant="ghost" icon="message-circle" title="Все комментарии, включая скрытые" onClick={() => f.set({ tab: "comments", post: String(post.id), status: undefined, q: undefined })}>
          {String(post.commentsCount)}
        </Button>
        <span className="flex items-center gap-1 text-xs text-neutral-500">
          <Icon name="heart" size={14} /> {post.likesCount}
        </span>
        <div className="flex-1" />
        {post.status === "published" && (
          <Button size="sm" icon="eye-off" onClick={onHide}>
            Скрыть
          </Button>
        )}
        {post.status === "hidden" && (
          <Button size="sm" icon="undo" disabled={restore.isPending} onClick={() => restore.mutate(post.id)}>
            Вернуть в ленту
          </Button>
        )}
      </div>
    </Card>
  );
}

export function PostsPanel({ query, page, onPage }: { query: ModerationQuery; page: number; onPage: (p: number) => void }) {
  const posts = useModerationPosts({ ...query, page });
  const hide = useHidePost();
  const [hiding, setHiding] = useState<ModerationPost | null>(null);
  const rows = posts.data?.rows ?? [];
  return (
    <>
      <div className="flex max-w-[820px] flex-col gap-3">
        {posts.isLoading && <div className="h-40 animate-pulse rounded-2xl bg-neutral-50" />}
        {posts.error && <Callout tone="danger">Посты не загрузились: {posts.error.message}</Callout>}
        {!posts.isLoading && !posts.error && !rows.length && <EmptyState dashed icon="article" title="Постов не найдено" description="Измените фильтры или поиск." />}
        {rows.map((p) => (
          <PostCard key={p.id} post={p} onHide={() => setHiding(p)} />
        ))}
      </div>
      <Pager page={page} pageSize={MODERATION_PAGE} total={posts.data?.count ?? 0} onPage={onPage} />
      {hiding && (
        <HideModal
          subject="пост"
          pending={hide.isPending}
          error={hide.error}
          onClose={() => setHiding(null)}
          onConfirm={(reason) => hide.mutate({ id: hiding.id, reason }, { onSuccess: () => setHiding(null) })}
        />
      )}
    </>
  );
}
