import { useState } from "react";
import { MODERATION_PAGE, useHideComment, useModerationComments, useRestoreComment, type ModerationQuery } from "@/entities/moderation";
import { cn, formatDateTimeShort } from "@/shared/lib";
import { Button, Callout, EmptyState, Icon, Pager, Row, Table } from "@/shared/ui";
import { useFilters } from "../lib";
import { PersonLink, OrgLink, StatusPill, HideModal } from "./common";

export function CommentsPanel({ query, page, onPage }: { query: ModerationQuery; page: number; onPage: (p: number) => void }) {
  const f = useFilters();
  const comments = useModerationComments({ ...query, page });
  const hide = useHideComment();
  const restore = useRestoreComment();
  const [hiding, setHiding] = useState<number | null>(null);
  const rows = comments.data?.rows ?? [];
  return (
    <>
      {comments.error ? (
        <Callout tone="danger">Комментарии не загрузились: {comments.error.message}</Callout>
      ) : (
        <Table cols="190px minmax(260px,1fr) 200px 150px 120px 110px" minWidth={1080} head={["Автор", "Комментарий", "Пост", "Статус", "Дата", ""]}>
          {comments.isLoading && <div className="h-32 animate-pulse bg-neutral-50" />}
          {!comments.isLoading && !rows.length && <EmptyState icon="message-circle" title="Комментариев не найдено" />}
          {rows.map((c) => (
            <Row key={c.id} className={cn("items-start", c.status !== "published" && "bg-neutral-50")}>
              <span className="flex min-w-0 flex-col">
                <PersonLink person={c.author} />
                <OrgLink org={c.organization} />
              </span>
              <span className="text-[13px] leading-5 whitespace-pre-line">
                {c.parentId && <Icon name="corner-down-right" size={13} className="mr-1 text-neutral-400" />}
                {c.text}
                {c.status === "hidden" && <span className="mt-1 block text-[11px] text-warn">Причина: {c.hiddenReason || "не указана"}</span>}
              </span>
              <button onClick={() => f.set({ post: String(c.post.id) })} className="min-w-0 truncate border-0 bg-transparent p-0 text-left text-xs text-brand" title="Все комментарии этого поста">
                {c.post.title || `Пост #${c.post.id}`}
              </button>
              <span>
                <StatusPill status={c.status} />
              </span>
              <span className="text-xs text-neutral-500">{formatDateTimeShort(c.createdAt)}</span>
              <span className="text-right">
                {c.status === "published" && (
                  <Button size="xs" variant="ghost" icon="eye-off" onClick={() => setHiding(c.id)}>
                    Скрыть
                  </Button>
                )}
                {c.status === "hidden" && (
                  <Button size="xs" variant="ghost" icon="undo" disabled={restore.isPending} onClick={() => restore.mutate(c.id)}>
                    Вернуть
                  </Button>
                )}
              </span>
            </Row>
          ))}
        </Table>
      )}
      <Pager page={page} pageSize={MODERATION_PAGE} total={comments.data?.count ?? 0} onPage={onPage} />
      {hiding !== null && (
        <HideModal
          subject="комментарий"
          pending={hide.isPending}
          error={hide.error}
          onClose={() => setHiding(null)}
          onConfirm={(reason) => hide.mutate({ id: hiding, reason }, { onSuccess: () => setHiding(null) })}
        />
      )}
    </>
  );
}
