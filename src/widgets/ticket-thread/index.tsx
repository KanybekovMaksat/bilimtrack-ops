import { useState } from "react";
import { useCloseTicket, useReplyToTicket, type Ticket, type TicketMessage } from "@/entities/ticket";
import { cn } from "@/shared/lib";
import { Button, Card, Icon } from "@/shared/ui";

const STYLE = {
  user: { wrap: "justify-start", box: "max-w-[82%] border-neutral-200 bg-white", accent: "text-ink", icon: "user" },
  support: { wrap: "justify-end", box: "max-w-[82%] border-brand-100 bg-brand-50", accent: "text-brand", icon: "headset" },
  bot: { wrap: "justify-stretch", box: "w-full border-neutral-100 bg-neutral-50 text-[13px] text-neutral-600", accent: "text-neutral-500", icon: "robot" },
  system: { wrap: "justify-center", box: "border-transparent bg-transparent px-0 py-0.5 text-center text-xs text-neutral-400", accent: "text-neutral-400", icon: "settings-2" },
} as const;

function Message({ m }: { m: TicketMessage }) {
  const s = STYLE[m.kind] ?? STYLE.user;
  const isSystem = m.kind === "system";
  return (
    <div className={cn("flex", s.wrap)}>
      <div className={cn("flex flex-col gap-1.5 rounded-[14px] border px-[13px] py-[11px] text-sm", s.box)}>
        <div className={cn("flex items-center gap-[7px]", isSystem && "justify-center")}>
          <Icon name={s.icon} size={14} className={s.accent} />
          <span className={cn("text-[11px] font-semibold", s.accent, isSystem && "tracking-[.04em] uppercase")}>{m.who}</span>
          <span className="text-[11px] text-neutral-400">{m.time}</span>
        </div>
        {m.text && <div className={cn("leading-[1.45] whitespace-pre-line", (m.kind === "user" || m.kind === "support") && "text-ink")}>{m.text}</div>}
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

/** Conversation with the requester and the reply box (POST support-tickets/:id/messages/). */
export function TicketThread({ ticket }: { ticket: Ticket }) {
  const [draft, setDraft] = useState("");
  const [closeAfter, setCloseAfter] = useState(false);
  const reply = useReplyToTicket(ticket.id);
  const close = useCloseTicket(ticket.id);
  const closed = ticket.status === "closed";
  const pending = reply.isPending || close.isPending;
  const error = reply.error ?? close.error;

  const send = async () => {
    const text = draft.trim();
    if (!text) return;
    await reply.mutateAsync(text);
    setDraft("");
    if (closeAfter) await close.mutateAsync();
  };

  return (
    <Card className="flex flex-col overflow-hidden">
      <div className="flex flex-col gap-3.5 p-[18px]">
        {ticket.messages.length ? (
          ticket.messages.map((m, i) => <Message key={i} m={m} />)
        ) : (
          <div className="py-6 text-center text-[13px] text-neutral-400">Сообщений пока нет</div>
        )}
      </div>
      <div className="border-t border-neutral-100 bg-neutral-50 px-[18px] py-3.5">
        {closed ? (
          <div className="text-center text-[13px] text-neutral-500">Тикет закрыт. Ответить можно, но пользователь его уже не ждёт.</div>
        ) : null}
        <div className={cn("flex flex-col gap-2.5 rounded-[14px] border border-neutral-200 bg-white px-3.5 py-3", closed && "mt-2.5")}>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) send().catch(() => {});
            }}
            placeholder={ticket.source === "telegram" ? "Ответ уйдёт пользователю в Telegram…" : "Ответ пользователю…"}
            rows={3}
            className="resize-none border-0 bg-transparent font-sans text-sm outline-none placeholder:text-neutral-400"
          />
          {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error.message}</div>}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-neutral-400">Ctrl + Enter — отправить</span>
            <div className="flex-1" />
            {!closed && (
              <label className="flex items-center gap-1.5 text-xs text-neutral-500">
                <input type="checkbox" checked={closeAfter} onChange={(e) => setCloseAfter(e.target.checked)} className="accent-brand" />
                Закрыть после отправки
              </label>
            )}
            <Button size="sm" variant="primary" className="px-4" disabled={!draft.trim() || pending} onClick={() => send().catch(() => {})}>
              {pending ? "Отправляем…" : "Отправить"}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
