import { useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  MODERATION_PAGE,
  chatTitle,
  useDeleteMessage,
  useModerationChat,
  useModerationChats,
  useModerationMessages,
  type ModerationMessage,
  type ModerationQuery,
} from "@/entities/moderation";
import { cn, formatBytes, formatDateTimeShort } from "@/shared/lib";
import { Button, Callout, Cell, EmptyState, Icon, Modal, ModalActions, Pager, Pill, Row, SearchInput, Table, ToggleChip } from "@/shared/ui";
import { useFilters } from "../lib";
import { PersonLink } from "./common";

export function ChatsPanel({ query, page, onPage }: { query: ModerationQuery; page: number; onPage: (p: number) => void }) {
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
            <Icon name="paperclip" size={14} /> {a.name || "Файл"} · {formatBytes(a.size)}
          </a>
        ),
      )}
    </div>
  );
}

/** Mounted per chat (`key`), so page, search and sender reset before the first request — one audit record per real read. */
export function ChatConversation({ chatId }: { chatId: number }) {
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
