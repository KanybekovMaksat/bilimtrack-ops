import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import {
  MODERATION_PAGE,
  POST_STATUS,
  REPORT_STATUS,
  chatTitle,
  useDeleteMessage,
  useHideComment,
  useHidePost,
  useModerationChat,
  useModerationChats,
  useModerationComments,
  useModerationMessages,
  useModerationPosts,
  useModerationReports,
  useModerationUser,
  useResolveReport,
  useRestoreComment,
  useRestorePost,
  type ModerationMessage,
  type ModerationPerson,
  type ModerationPost,
  type ModerationQuery,
  type ModerationReport,
} from "@/entities/moderation";
import { useOrganizationsSoft } from "@/entities/organization";
import { cn, formatDateTimeShort, initialsOf } from "@/shared/lib";
import {
  Avatar,
  Button,
  Callout,
  Card,
  Cell,
  Drawer,
  EmptyState,
  Icon,
  Modal,
  ModalActions,
  PageHeader,
  Pager,
  Pill,
  Row,
  SearchInput,
  SelectInput,
  Table,
  Tabs,
  TextArea,
  ToggleChip,
} from "@/shared/ui";

type Tab = "reports" | "posts" | "comments" | "chats";

const STATUS_OPTIONS: Record<Tab, { value: string; label: string }[]> = {
  reports: [
    { value: "open", label: "Ожидают разбора" },
    { value: "resolved", label: "Меры приняты" },
    { value: "rejected", label: "Отклонены" },
  ],
  posts: [
    { value: "published", label: "Опубликованные" },
    { value: "hidden", label: "Скрытые" },
    { value: "archived", label: "Удалённые автором" },
    { value: "draft", label: "Черновики" },
  ],
  comments: [
    { value: "published", label: "Опубликованные" },
    { value: "hidden", label: "Скрытые" },
    { value: "archived", label: "Удалённые автором" },
  ],
  chats: [],
};

const PLACEHOLDER: Record<Tab, string> = {
  reports: "Пояснение к жалобе",
  posts: "Текст и заголовок поста",
  comments: "Текст комментария",
  chats: "Название чата или участник",
};

const QUICK_REASONS = ["Оскорбления", "Нецензурная лексика", "Спам или реклама", "Личные данные", "Травля"];

/** The whole page state lives in the URL, so a selection («все скрытые комментарии этого студента») can be shared. */
function useFilters() {
  const [params, setParams] = useSearchParams();
  const get = (k: string) => params.get(k) ?? undefined;
  const set = (patch: Record<string, string | undefined>) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        for (const [k, v] of Object.entries(patch)) {
          if (v === undefined || v === "") next.delete(k);
          else next.set(k, v);
        }
        if (!("page" in patch)) next.delete("page");
        return next;
      },
      { replace: true },
    );
  return { get, set };
}

const num = (v?: string) => (v && Number(v) > 0 ? Number(v) : undefined);

function PersonLink({ person }: { person: ModerationPerson | null }) {
  const f = useFilters();
  if (!person) return <span className="text-neutral-400">Удалённый пользователь</span>;
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        f.set({ user: String(person.id), page: f.get("page") });
      }}
      className="border-0 bg-transparent p-0 text-left text-[13px] font-medium text-brand hover:underline"
      title={`Карточка ${person.username}`}
    >
      {person.fullName || person.username}
    </button>
  );
}

function OrgLink({ org }: { org: { id: number; name: string } }) {
  const f = useFilters();
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        f.set({ org: String(org.id) });
      }}
      className="border-0 bg-transparent p-0 text-left text-[11px] text-neutral-500 hover:text-brand"
      title="Только эта организация"
    >
      {org.name}
    </button>
  );
}

function StatusPill({ status }: { status: string }) {
  const s = POST_STATUS[status] ?? { label: status, tone: "neutral" as const };
  return (
    <Pill size="sm" tone={s.tone}>
      {s.label}
    </Pill>
  );
}

function HideModal({ subject, onClose, onConfirm, pending, error }: { subject: string; onClose: () => void; onConfirm: (reason: string) => void; pending: boolean; error: Error | null }) {
  const [reason, setReason] = useState("");
  return (
    <Modal open onClose={onClose} width={520} title={`Скрыть ${subject}`}>
      <div className="text-[13px] leading-5 text-neutral-600">Пропадёт из ленты у всех. Автор не сможет вернуть, вы — сможете. Действие попадёт в журнал организации.</div>
      <div className="flex flex-wrap gap-1.5">
        {QUICK_REASONS.map((r) => (
          <ToggleChip key={r} on={reason === r} label={r} icon={reason === r ? "check" : "flag"} onClick={() => setReason(r)} />
        ))}
      </div>
      <TextArea look="plain" value={reason} maxLength={1000} onChange={(e) => setReason(e.target.value)} placeholder="Причина скрытия" />
      {error && <div className="rounded-xl bg-red-50 px-3.5 py-2.5 text-xs text-red-600">{error.message}</div>}
      <ModalActions>
        <Button size="xl" onClick={onClose}>
          Отмена
        </Button>
        <Button size="xl" variant="danger" icon="eye-off" disabled={pending} onClick={() => onConfirm(reason.trim())}>
          Скрыть
        </Button>
      </ModalActions>
    </Modal>
  );
}

// ── Посты ──────────────────────────────────────────────────────────────────

function PostCard({ post, onHide }: { post: ModerationPost; onHide: () => void }) {
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

function PostsPanel({ query, page, onPage }: { query: ModerationQuery; page: number; onPage: (p: number) => void }) {
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

// ── Комментарии ────────────────────────────────────────────────────────────

function CommentsPanel({ query, page, onPage }: { query: ModerationQuery; page: number; onPage: (p: number) => void }) {
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

// ── Чаты ───────────────────────────────────────────────────────────────────

function ChatsPanel({ query, page, onPage }: { query: ModerationQuery; page: number; onPage: (p: number) => void }) {
  const f = useFilters();
  const chats = useModerationChats({ ...query, page });
  const rows = chats.data?.rows ?? [];
  return (
    <>
      {chats.error ? (
        <Callout tone="danger">Чаты не загрузились: {chats.error.message}</Callout>
      ) : (
        <Table cols="minmax(240px,1fr) minmax(240px,1fr) 110px 130px" minWidth={860} head={["Чат", "Участники", "Сообщений", "Последнее"]}>
          {chats.isLoading && <div className="h-32 animate-pulse bg-neutral-50" />}
          {!chats.isLoading && !rows.length && <EmptyState icon="messages" title="Чатов не найдено" />}
          {rows.map((c) => (
            <Row key={c.id} onClick={() => f.set({ chat: String(c.id), page: f.get("page") })}>
              <span className="flex min-w-0 flex-col">
                <span className="flex items-center gap-1.5 font-medium">
                  <Icon name={c.type === "group" ? "users-group" : "messages"} size={15} className="text-neutral-400" />
                  <Cell>{chatTitle(c)}</Cell>
                </span>
                <span className="text-[11px] text-neutral-400">
                  {c.type === "group" ? "Чат предмета" : "Личный"} · {c.organization.name}
                </span>
              </span>
              <Cell className="text-xs text-neutral-600">
                {c.participants.length > 4
                  ? `${c.participants.slice(0, 3).map((p) => p.fullName).join(", ")} и ещё ${c.participants.length - 3}`
                  : c.participants.map((p) => p.fullName).join(", ")}
              </Cell>
              <span className="font-num text-xs">{c.messagesCount}</span>
              <span className="text-xs text-neutral-500">{formatDateTimeShort(c.lastMessageAt)}</span>
            </Row>
          ))}
        </Table>
      )}
      <Pager page={page} pageSize={MODERATION_PAGE} total={chats.data?.count ?? 0} onPage={onPage} />
    </>
  );
}

const formatSize = (bytes: number) => (bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} МБ` : `${Math.max(1, Math.round(bytes / 1024))} КБ`);

function Message({ m, onDelete }: { m: ModerationMessage; onDelete: () => void }) {
  const deleted = m.deletedAt !== null;
  return (
    <div className={cn("flex flex-col gap-1 rounded-xl border px-3 py-2.5", deleted ? "border-red-100 bg-red-50/50" : "border-neutral-100 bg-white")}>
      <div className="flex items-center gap-2">
        <PersonLink person={m.sender} />
        <span className="text-[11px] text-neutral-400">{formatDateTimeShort(m.sentAt)}</span>
        {m.editedAt && <span className="text-[11px] text-neutral-400">· изменено</span>}
        <div className="flex-1" />
        {deleted ? (
          <Pill size="sm" tone="danger">
            Удалено {formatDateTimeShort(m.deletedAt)}
          </Pill>
        ) : (
          <Button size="xs" variant="ghost" icon="trash" aria-label="Удалить у всех" title="Удалить у всех" onClick={onDelete} />
        )}
      </div>
      {m.replyTo && (
        <div className="flex gap-1.5 rounded-lg bg-neutral-50 px-2.5 py-1.5 text-xs text-neutral-500">
          <Icon name="corner-up-left" size={13} />
          <span className="min-w-0">
            <b className="font-medium">{m.replyTo.sender?.fullName ?? "Удалённый пользователь"}</b>
            {m.replyTo.isDeleted && <em> · удалено</em>} {m.replyTo.text || "Вложение"}
          </span>
        </div>
      )}
      {m.text && <div className="text-[13px] leading-5 whitespace-pre-line">{m.text}</div>}
      {m.attachments.map((a) =>
        a.contentType.startsWith("image/") && a.url ? (
          <a key={a.id} href={a.url} target="_blank" rel="noreferrer">
            <img src={a.url} alt={a.name} loading="lazy" className="max-h-48 rounded-lg" />
          </a>
        ) : (
          <a key={a.id} href={a.url ?? undefined} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs">
            <Icon name="paperclip" size={14} /> {a.name || "Файл"} · {formatSize(a.size)}
          </a>
        ),
      )}
    </div>
  );
}

/** Mounted per chat (`key`), so page, search and sender reset before the first request — one audit record per real read. */
function ChatConversation({ chatId }: { chatId: number }) {
  const [page, setPage] = useState(1);
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [senderId, setSenderId] = useState<number | undefined>();
  const [deleting, setDeleting] = useState<ModerationMessage | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const chat = useModerationChat(chatId);
  const messages = useModerationMessages(chatId, { page, q: search || undefined, senderId });
  const remove = useDeleteMessage(chatId);
  const rows = useMemo(() => [...(messages.data?.rows ?? [])].reverse(), [messages.data]);
  const total = messages.data?.count ?? 0;
  const pages = Math.max(1, Math.ceil(total / MODERATION_PAGE));
  const newest = rows.at(-1)?.id;
  useLayoutEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [newest]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-col gap-2.5 border-b border-neutral-100 px-[18px] py-3.5">
        <div className="text-xs text-neutral-500">
          {chat.data ? `${chat.data.organization.name} · ${chat.data.type === "group" ? "чат предмета" : "личный чат"} · ${chat.data.messagesCount} сообщ.` : "Загрузка…"}
        </div>
        <Callout tone="warn" icon="history" className="py-2">
          Каждое открытие переписки записывается в журнал организации.
        </Callout>
        {chat.data && (
          <div className="flex flex-wrap gap-1.5">
            <ToggleChip on={senderId === undefined} label="Все" icon="users" onClick={() => (setSenderId(undefined), setPage(1))} />
            {chat.data.participants.map((p) => (
              <ToggleChip key={p.id} on={senderId === p.id} label={p.fullName} icon="user" onClick={() => (setSenderId(p.id), setPage(1))} />
            ))}
          </div>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSearch(input.trim());
            setPage(1);
          }}
        >
          <SearchInput width={360} placeholder="Поиск по сообщениям (Enter)" value={input} onChange={setInput} />
        </form>
      </div>
      <div ref={listRef} className="flex flex-1 flex-col gap-2 overflow-auto bg-neutral-50 px-[18px] py-3.5">
        {messages.isLoading && <div className="text-center text-xs text-neutral-400">Загрузка переписки…</div>}
        {messages.error && <div className="text-center text-xs text-red-600">{messages.error.message}</div>}
        {!messages.isLoading && !rows.length && <div className="text-center text-xs text-neutral-400">{search || senderId ? "Ничего не найдено" : "Сообщений нет"}</div>}
        {rows.map((m) => (
          <Message key={m.id} m={m} onDelete={() => setDeleting(m)} />
        ))}
      </div>
      {pages > 1 && (
        <div className="flex items-center gap-2 border-t border-neutral-100 px-[18px] py-2.5 text-xs text-neutral-500">
          <Button size="xs" disabled={page >= pages} onClick={() => setPage(page + 1)}>
            Раньше
          </Button>
          <span className="flex-1 text-center">
            {(page - 1) * MODERATION_PAGE + 1}–{Math.min(page * MODERATION_PAGE, total)} с конца из {total}
          </span>
          <Button size="xs" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            Позже
          </Button>
        </div>
      )}
      {deleting && (
        <Modal open onClose={() => setDeleting(null)} width={480} title="Удалить сообщение у всех?">
          <div className="text-[13px] leading-5 text-neutral-600">Сообщение пропадёт у всех участников. Текст сохранится для разбора и в журнале организации.</div>
          {remove.error && <div className="text-xs text-red-600">{remove.error.message}</div>}
          <ModalActions>
            <Button size="xl" onClick={() => setDeleting(null)}>
              Отмена
            </Button>
            <Button size="xl" variant="danger" disabled={remove.isPending} onClick={() => remove.mutate(deleting.id, { onSuccess: () => setDeleting(null) })}>
              Удалить
            </Button>
          </ModalActions>
        </Modal>
      )}
    </div>
  );
}

// ── Жалобы ─────────────────────────────────────────────────────────────────

function ReportsPanel({ query, page, onPage }: { query: ModerationQuery; page: number; onPage: (p: number) => void }) {
  const reports = useModerationReports({ ...query, page });
  const [resolving, setResolving] = useState<{ report: ModerationReport; accept: boolean } | null>(null);
  const rows = reports.data?.rows ?? [];
  return (
    <>
      <div className="flex max-w-[980px] flex-col gap-2.5">
        {reports.isLoading && <div className="h-32 animate-pulse rounded-2xl bg-neutral-50" />}
        {reports.error && <Callout tone="danger">Жалобы не загрузились: {reports.error.message}</Callout>}
        {!reports.isLoading && !reports.error && !rows.length && <EmptyState dashed icon="flag" title="Жалоб нет" description="Очередь пуста — или измените фильтр статуса." />}
        {rows.map((r) => {
          const st = REPORT_STATUS[r.status];
          const target = r.post?.text || r.post?.title || r.comment?.text || "";
          return (
            <Card key={r.id} className="flex flex-col gap-2.5 p-4">
              <div className="flex items-center gap-2">
                <Icon name="flag" size={16} className="text-red-500" />
                <span className="text-[13px] font-medium">{r.reasonLabel}</span>
                <Pill size="sm" tone="neutral">
                  {r.targetType === "post" ? "Пост" : r.targetType === "comment" ? "Комментарий" : "Профиль"}
                </Pill>
                {r.targetReportsCount > 1 && (
                  <Pill size="sm" tone="danger">
                    {r.targetReportsCount} жалоб на эту цель
                  </Pill>
                )}
                <div className="flex-1" />
                <Pill size="sm" tone={st.tone}>
                  {st.label}
                </Pill>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-500">
                <span>
                  На: <PersonLink person={r.reportedUser} />
                </span>
                <span>
                  От: <PersonLink person={r.reporter} />
                </span>
                <OrgLink org={r.organization} />
                <span>{formatDateTimeShort(r.createdAt)}</span>
              </div>
              {r.details && <div className="text-[13px] text-neutral-700">«{r.details}»</div>}
              {target && <div className="line-clamp-4 rounded-lg bg-neutral-50 px-3 py-2 text-[13px] leading-5 whitespace-pre-line text-neutral-700">{target}</div>}
              {r.status !== "open" && (
                <div className="text-xs text-neutral-500">
                  {r.resolvedBy?.fullName ?? "—"} · {formatDateTimeShort(r.resolvedAt)}
                  {r.resolutionNote && ` · ${r.resolutionNote}`}
                </div>
              )}
              {r.status === "open" && (
                <div className="flex justify-end gap-2 border-t border-neutral-100 pt-2.5">
                  <Button size="sm" onClick={() => setResolving({ report: r, accept: false })}>
                    Отклонить
                  </Button>
                  <Button size="sm" variant="danger" icon="eye-off" onClick={() => setResolving({ report: r, accept: true })}>
                    {r.targetType === "user" ? "Принять меры" : "Скрыть и закрыть"}
                  </Button>
                </div>
              )}
            </Card>
          );
        })}
      </div>
      <Pager page={page} pageSize={MODERATION_PAGE} total={reports.data?.count ?? 0} onPage={onPage} />
      {resolving && <ResolveModal {...resolving} onClose={() => setResolving(null)} />}
    </>
  );
}

function ResolveModal({ report, accept, onClose }: { report: ModerationReport; accept: boolean; onClose: () => void }) {
  const resolve = useResolveReport();
  const [note, setNote] = useState("");
  return (
    <Modal open onClose={onClose} width={500} title={accept ? "Принять жалобу" : "Отклонить жалобу"}>
      <div className="text-[13px] leading-5 text-neutral-600">
        {accept
          ? report.targetType === "user"
            ? "Жалоба и все открытые жалобы на этот профиль закроются как «меры приняты»."
            : "Контент скроется, а жалоба и все открытые жалобы на него закроются как «меры приняты»."
          : "Жалоба и все открытые жалобы на ту же цель закроются как отклонённые."}
      </div>
      <TextArea look="plain" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Заметка для журнала (необязательно)" />
      {resolve.error && <div className="text-xs text-red-600">{resolve.error.message}</div>}
      <ModalActions>
        <Button size="xl" onClick={onClose}>
          Отмена
        </Button>
        <Button size="xl" variant={accept ? "danger" : "primary"} disabled={resolve.isPending} onClick={() => resolve.mutate({ id: report.id, accept, note }, { onSuccess: onClose })}>
          {accept ? "Принять" : "Отклонить"}
        </Button>
      </ModalActions>
    </Modal>
  );
}

// ── Карточка пользователя ──────────────────────────────────────────────────

const PROFILE_LABEL = { employee: "Сотрудник", learner: "Студент", guardian: "Представитель" };

function UserDrawer({ userId, onClose }: { userId: number; onClose: () => void }) {
  const f = useFilters();
  const user = useModerationUser(userId);
  const d = user.data;
  const name = d ? d.account.profiles[0]?.fullName || d.account.username : "Пользователь";
  const show = (tab: Tab) => d && f.set({ tab, person: String(d.account.id), personName: name, user: undefined, chat: undefined, post: undefined, status: undefined, q: undefined });
  return (
    <Drawer
      open
      onClose={onClose}
      header={
        <>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[15px] font-semibold">{name}</div>
            <div className="font-num text-[11px] text-neutral-400">{d ? `${d.account.username} · ID ${d.account.id}` : "Загрузка…"}</div>
          </div>
          <Button size="sm" variant="ghost" icon="x" onClick={onClose} aria-label="Закрыть" />
        </>
      }
    >
      <div className="flex flex-col gap-3.5 p-[18px]">
        {user.isLoading && <div className="h-32 animate-pulse rounded-xl bg-neutral-50" />}
        {user.error && <Callout tone="danger">{user.error.message}</Callout>}
        {d && (
          <>
            <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500">
              <Pill size="sm" tone={d.account.isActive ? "success" : "danger"}>
                {d.account.isActive ? "Активен" : "Заблокирован"}
              </Pill>
              <span>{d.account.email || "почта не указана"}</span>
              <span>{d.account.phone || "телефон не указан"}</span>
              <span>вход: {formatDateTimeShort(d.account.lastLogin)}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  ["posts", "article", d.forumPosts.total, "постов", `скрыто ${d.forumPosts.hidden} · удалено ${d.forumPosts.deleted}`],
                  ["comments", "message-circle", d.forumComments.total, "комментариев", `скрыто ${d.forumComments.hidden} · удалено ${d.forumComments.deleted}`],
                  ["chats", "messages", d.chats.total, "чатов", `сообщений ${d.chats.messagesTotal} · удалено ${d.chats.messagesDeleted}`],
                ] as [Tab, string, number, string, string][]
              ).map(([tab, icon, n, label, sub]) => (
                <button key={tab} onClick={() => show(tab)} className="flex flex-col gap-1 rounded-xl border border-neutral-200 bg-white p-3 text-left hover:border-brand">
                  <Icon name={icon} size={17} className="text-neutral-400" />
                  <span className="font-num text-lg font-semibold">{n}</span>
                  <span className="text-xs">{label}</span>
                  <span className="text-[10px] leading-[13px] text-neutral-400">{sub}</span>
                </button>
              ))}
            </div>
            <div className="text-xs font-semibold text-neutral-500">Организации и роли</div>
            {!d.account.memberships.length && <div className="text-xs text-neutral-400">Членств нет</div>}
            {d.account.memberships.map((m) => (
              <div key={m.id} className="flex flex-col gap-1.5 rounded-xl border border-neutral-200 p-3">
                <div className="flex items-center gap-2 text-[13px] font-medium">
                  <Icon name="building" size={15} className="text-neutral-400" />
                  {m.organization.name}
                  {m.status !== "active" && <Pill size="sm">{m.status}</Pill>}
                </div>
                <div className="flex flex-wrap gap-1">
                  {m.roles.map((r) => (
                    <Pill key={r.id} size="sm" tone="info">
                      {r.name}
                    </Pill>
                  ))}
                </div>
                {d.account.profiles
                  .filter((p) => p.organization.id === m.organization.id)
                  .map((p) => (
                    <div key={`${p.profileType}-${p.id}`} className="text-xs text-neutral-500">
                      {p.fullName} · {PROFILE_LABEL[p.profileType]}
                    </div>
                  ))}
              </div>
            ))}
          </>
        )}
      </div>
    </Drawer>
  );
}

// ── Страница ───────────────────────────────────────────────────────────────

export function ModerationPage() {
  const f = useFilters();
  const orgs = useOrganizationsSoft().data ?? [];
  const tab: Tab = (["posts", "comments", "chats", "reports"] as Tab[]).includes(f.get("tab") as Tab) ? (f.get("tab") as Tab) : "reports";
  const [search, setSearch] = useState(f.get("q") ?? "");
  const page = num(f.get("page")) ?? 1;
  const chatId = num(f.get("chat"));
  const userId = num(f.get("user"));
  const q = f.get("q");

  // The box follows the URL when it changes from outside (tab switch, filter reset).
  const [shownQ, setShownQ] = useState(q);
  if (shownQ !== q) {
    setShownQ(q);
    setSearch(q ?? "");
  }
  useEffect(() => {
    const t = setTimeout(() => {
      if (search.trim() !== (q ?? "")) f.set({ q: search.trim() || undefined });
    }, 400);
    return () => clearTimeout(t);
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  const person = f.get("person");
  const query: ModerationQuery = {
    q: tab === "reports" ? undefined : q,
    status: f.get("status"),
    type: tab === "chats" ? f.get("type") : undefined,
    organizationId: num(f.get("org")),
    ...(tab === "chats" ? { participantId: num(person) } : tab === "reports" ? { reportedUserId: num(person) } : { authorId: num(person) }),
    postId: tab === "comments" ? num(f.get("post")) : undefined,
  };
  const onPage = (p: number) => f.set({ page: String(p) });
  const openReports = useModerationReports({ status: "open", page: 1 });

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Модерация" subtitle="жалобы, посты, комментарии и чаты всех организаций" />
      <Callout tone="mutedBorder" icon="history" iconClassName="text-neutral-400">
        Скрытие, удаление и каждое открытие переписки записываются в журнал действий организации.
      </Callout>
      <Tabs<Tab>
        value={tab}
        onChange={(k) => f.set({ tab: k, status: undefined, type: undefined, q: undefined, post: undefined })}
        items={[
          { key: "reports", label: "Жалобы", count: openReports.data?.count || undefined },
          { key: "posts", label: "Посты" },
          { key: "comments", label: "Комментарии" },
          { key: "chats", label: "Чаты" },
        ]}
      />
      <div className="flex flex-wrap items-center gap-2">
        {tab !== "reports" && <SearchInput width={280} placeholder={PLACEHOLDER[tab]} value={search} onChange={setSearch} />}
        {STATUS_OPTIONS[tab].length > 0 && (
          <SelectInput className="w-[200px]" placeholder="Статус: все" value={f.get("status") ?? ""} onChange={(e) => f.set({ status: e.target.value || undefined })} options={STATUS_OPTIONS[tab]} />
        )}
        {tab === "chats" && (
          <SelectInput
            className="w-[180px]"
            placeholder="Тип: все"
            value={f.get("type") ?? ""}
            onChange={(e) => f.set({ type: e.target.value || undefined })}
            options={[
              { value: "direct", label: "Личные" },
              { value: "group", label: "Чаты предметов" },
            ]}
          />
        )}
        <SelectInput
          className="w-[220px]"
          placeholder="Все организации"
          value={f.get("org") ?? ""}
          onChange={(e) => f.set({ org: e.target.value || undefined })}
          options={orgs.map((o) => ({ value: String(o.id), label: o.name }))}
        />
        {person && (
          <button onClick={() => f.set({ person: undefined, personName: undefined })} className="flex h-[34px] items-center gap-1.5 rounded-full border border-brand bg-brand-50 px-3 text-[13px] text-brand">
            {tab === "chats" ? "Участник" : "Автор"}: {f.get("personName") || `#${person}`}
            <Icon name="x" size={14} />
          </button>
        )}
        {tab === "comments" && f.get("post") && (
          <button onClick={() => f.set({ post: undefined })} className="flex h-[34px] items-center gap-1.5 rounded-full border border-brand bg-brand-50 px-3 text-[13px] text-brand">
            Пост #{f.get("post")}
            <Icon name="x" size={14} />
          </button>
        )}
      </div>

      {tab === "reports" && <ReportsPanel query={query} page={page} onPage={onPage} />}
      {tab === "posts" && <PostsPanel query={query} page={page} onPage={onPage} />}
      {tab === "comments" && <CommentsPanel query={query} page={page} onPage={onPage} />}
      {tab === "chats" && <ChatsPanel query={query} page={page} onPage={onPage} />}

      {chatId && (
        <Drawer
          open
          onClose={() => f.set({ chat: undefined, page: f.get("page") })}
          header={
            <>
              <div className="flex-1 text-[15px] font-semibold">Переписка</div>
              <Button size="sm" variant="ghost" icon="x" onClick={() => f.set({ chat: undefined, page: f.get("page") })} aria-label="Закрыть" />
            </>
          }
        >
          <ChatConversation key={chatId} chatId={chatId} />
        </Drawer>
      )}
      {userId && <UserDrawer userId={userId} onClose={() => f.set({ user: undefined, page: f.get("page") })} />}
    </div>
  );
}
