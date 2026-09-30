import { useEffect, useRef, useState } from "react";
import { useSession } from "@/entities/session";
import { fillTemplate, useReplyToTicket, useUpdateTicket, type ReplyTemplate, type TicketDetail, type TicketMessage, type TicketStatus } from "@/entities/ticket";
import { ReplyTemplatePicker } from "@/features/manage-reply-templates";
import { cn, formatBytes, formatDateTimeShort } from "@/shared/lib";
import { Button, Card, Dropdown, ErrorNote, Icon, Segmented } from "@/shared/ui";

const STYLE = {
  user: { wrap: "justify-start", box: "max-w-[82%] border-neutral-200 bg-white", accent: "text-ink", icon: "user" },
  support: { wrap: "justify-end", box: "max-w-[82%] border-brand-100 bg-brand-50", accent: "text-brand", icon: "headset" },
  bot: { wrap: "justify-stretch", box: "w-full border-neutral-100 bg-neutral-50 text-[13px] text-neutral-600", accent: "text-neutral-500", icon: "robot" },
  system: { wrap: "justify-center", box: "border-transparent bg-transparent px-0 py-0.5 text-center text-xs text-neutral-400", accent: "text-neutral-400", icon: "settings-2" },
  // A team note: visually apart from the conversation, so it is never mistaken for something the requester saw.
  note: { wrap: "justify-end", box: "max-w-[82%] border-dashed border-amber-500 bg-amber-50", accent: "text-warn", icon: "lock" },
} as const;

/** Largest file the reply box accepts; the backend stores attachments as they are. */
const MAX_ATTACHMENT = 20 * 1024 * 1024;

type Mode = "reply" | "note";
type AfterSend = "keep" | "resolved" | "closed";

function Message({ m }: { m: TicketMessage }) {
  const s = m.internal ? STYLE.note : (STYLE[m.kind] ?? STYLE.user);
  const isSystem = m.kind === "system";
  return (
    <div className={cn("flex", s.wrap)}>
      <div className={cn("flex flex-col gap-1.5 rounded-[14px] border px-[13px] py-[11px] text-sm", s.box)}>
        <div className={cn("flex items-center gap-[7px]", isSystem && "justify-center")}>
          <Icon name={s.icon} size={14} className={s.accent} />
          <span className={cn("text-[11px] font-semibold", s.accent, isSystem && "tracking-[.04em] uppercase")}>
            {m.internal ? `Заметка команды · ${m.who}` : m.kind === "support" ? `Поддержка · ${m.who}` : m.who}
          </span>
          <span className="text-[11px] text-neutral-400">{formatDateTimeShort(m.createdAt)}</span>
        </div>
        {m.text && <div className={cn("leading-[1.45] break-words whitespace-pre-line", (m.kind === "user" || m.kind === "support") && "text-ink")}>{m.text}</div>}
        {m.attachment && (
          <a href={m.attachment.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs">
            <Icon name="paperclip" size={14} />
            {m.attachment.name}
          </a>
        )}
      </div>
    </div>
  );
}

/**
 * Conversation with the requester and the reply box. The ticket is polled by its query, so new messages
 * arrive on their own; the list follows them to the bottom unless the operator scrolled up to read.
 */
export function TicketThread({ ticket }: { ticket: TicketDetail }) {
  const me = useSession((s) => s.user);
  const [mode, setMode] = useState<Mode>("reply");
  const [draft, setDraft] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [templateId, setTemplateId] = useState<number | null>(null);
  const [afterSend, setAfterSend] = useState<AfterSend>("keep");
  const reply = useReplyToTicket(ticket.id);
  const update = useUpdateTicket(ticket.id);
  const listRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const stickToBottom = useRef(true);

  const lastId = ticket.messages[ticket.messages.length - 1]?.id;
  useEffect(() => {
    const el = listRef.current;
    if (el && stickToBottom.current) el.scrollTop = el.scrollHeight;
  }, [lastId]);

  const done = ticket.status === "resolved" || ticket.status === "closed";
  const pending = reply.isPending || update.isPending;
  const isNote = mode === "note";
  const canSend = (draft.trim().length > 0 || file !== null) && !pending;

  const insertTemplate = (t: ReplyTemplate) => {
    const text = fillTemplate(t.text, { name: ticket.fullName, ticket: ticket.number, operator: me?.fullName || me?.username || "" });
    setDraft((prev) => (prev.trim() ? `${prev.trimEnd()}\n\n${text}` : text));
    setTemplateId(t.id);
    setMode("reply");
    inputRef.current?.focus();
  };

  const pickFile = (picked: File | undefined) => {
    if (!picked) return;
    if (picked.size > MAX_ATTACHMENT) {
      setFileError(`Файл больше ${formatBytes(MAX_ATTACHMENT)} — отправьте ссылкой.`);
      return;
    }
    setFileError(null);
    setFile(picked);
  };

  const send = async () => {
    if (!canSend) return;
    stickToBottom.current = true;
    await reply.mutateAsync({ text: draft.trim(), attachment: file, internal: isNote, templateId: isNote ? null : templateId });
    setDraft("");
    setFile(null);
    setTemplateId(null);
    if (!isNote && afterSend !== "keep") {
      await update.mutateAsync({ status: afterSend satisfies TicketStatus });
      setAfterSend("keep");
    }
  };

  return (
    <Card className="flex flex-col overflow-hidden">
      <div
        ref={listRef}
        onScroll={(e) => {
          const el = e.currentTarget;
          stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
        }}
        className="flex max-h-[calc(100vh-430px)] min-h-[240px] flex-col gap-3.5 overflow-auto p-[18px]"
      >
        {ticket.messages.length ? (
          ticket.messages.map((m) => <Message key={m.id} m={m} />)
        ) : (
          <div className="py-6 text-center text-[13px] text-neutral-400">Сообщений пока нет</div>
        )}
      </div>
      <div className="border-t border-neutral-100 bg-neutral-50 px-[18px] py-3.5">
        <div className="mb-2.5 flex items-center gap-2">
          <Segmented<Mode>
            size="md"
            value={mode}
            onChange={setMode}
            options={[
              { value: "reply", label: "Ответ", icon: "send" },
              { value: "note", label: "Заметка команде", icon: "lock" },
            ]}
          />
          {!isNote && <ReplyTemplatePicker category={ticket.category} onPick={insertTemplate} />}
          <div className="flex-1" />
          {done && !isNote && <span className="text-xs text-neutral-500">Тикет завершён: ответ уйдёт автору, статус не изменится.</span>}
        </div>
        <div className={cn("flex flex-col gap-2.5 rounded-[14px] border bg-white px-3.5 py-3", isNote ? "border-dashed border-amber-500 bg-amber-50" : "border-neutral-200")}>
          <textarea
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) send().catch(() => {});
            }}
            placeholder={
              isNote ? "Заметка видна только команде Bilimtrack — автор обращения её не увидит…" : ticket.source === "telegram" ? "Ответ уйдёт пользователю в Telegram…" : "Ответ пользователю…"
            }
            rows={4}
            className="resize-y border-0 bg-transparent font-sans text-sm outline-none placeholder:text-neutral-400"
          />
          {file && (
            <span className="inline-flex items-center gap-1.5 self-start rounded-full bg-neutral-100 py-1 pr-1.5 pl-2.5 text-xs">
              <Icon name="paperclip" size={14} className="text-neutral-400" />
              <span className="max-w-[280px] truncate">{file.name}</span>
              <span className="text-neutral-400">{formatBytes(file.size)}</span>
              <button type="button" aria-label="Убрать файл" onClick={() => setFile(null)} className="flex border-0 bg-transparent p-0.5 text-neutral-400 hover:text-ink">
                <Icon name="x" size={14} />
              </button>
            </span>
          )}
          {fileError && <span className="text-xs text-red-600">{fileError}</span>}
          <ErrorNote error={reply.error ?? update.error} />
          <div className="flex items-center gap-2">
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              onChange={(e) => {
                pickFile(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
            <Button size="sm" variant="ghost" icon="paperclip" aria-label="Приложить файл" title="Приложить файл" onClick={() => fileRef.current?.click()} />
            <span className="text-[11px] text-neutral-400">Ctrl + Enter — отправить</span>
            <div className="flex-1" />
            {!isNote && !done && (
              <Dropdown<AfterSend>
                look="chip"
                label="После отправки"
                placeholder="оставить в работе"
                value={afterSend}
                onChange={(v) => setAfterSend(v ?? "keep")}
                options={[
                  { value: "keep", label: "оставить в работе" },
                  { value: "resolved", label: "отметить решённым", icon: "circle-check" },
                  { value: "closed", label: "закрыть тикет", icon: "check" },
                ]}
              />
            )}
            <Button size="md" variant="primary" className="px-4" disabled={!canSend} onClick={() => send().catch(() => {})}>
              {pending ? "Отправляем…" : isNote ? "Сохранить заметку" : "Отправить"}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
