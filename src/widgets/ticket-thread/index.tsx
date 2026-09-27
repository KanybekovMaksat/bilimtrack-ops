import { useState } from "react";
import type { TicketMessage } from "@/entities/ticket";
import { cn } from "@/shared/lib";
import { Button, Card, Icon } from "@/shared/ui";

const STYLE = {
  user: { wrap: "justify-start", box: "max-w-[82%] border-neutral-200 bg-white", accent: "text-ink", icon: "user" },
  support: { wrap: "justify-end", box: "max-w-[82%] border-brand-100 bg-brand-50", accent: "text-brand", icon: "headset" },
  bot: { wrap: "justify-stretch", box: "w-full border-neutral-100 bg-neutral-50 text-[13px] text-neutral-600", accent: "text-neutral-500", icon: "robot" },
  system: { wrap: "justify-center", box: "border-transparent bg-transparent px-0 py-0.5 text-center text-xs text-neutral-400", accent: "text-neutral-400", icon: "settings-2" },
} as const;

function Message({ m }: { m: TicketMessage }) {
  const s = STYLE[m.kind];
  const isSystem = m.kind === "system";
  return (
    <div className={cn("flex", s.wrap)}>
      <div className={cn("flex flex-col gap-1.5 rounded-[14px] border px-[13px] py-[11px] text-sm", s.box)}>
        <div className={cn("flex items-center gap-[7px]", isSystem && "justify-center")}>
          <Icon name={s.icon} size={14} className={s.accent} />
          <span className={cn("text-[11px] font-semibold", s.accent, isSystem && "tracking-[.04em] uppercase")}>{m.who}</span>
          <span className="text-[11px] text-neutral-400">{m.time}</span>
        </div>
        <div className={cn("leading-[1.45] whitespace-pre-line", m.kind === "user" || m.kind === "support" ? "text-ink" : undefined)}>{m.text}</div>
      </div>
    </div>
  );
}

/** Conversation with the requester plus the reply composer. */
export function TicketThread({ messages: initial }: { messages: TicketMessage[] }) {
  const [messages, setMessages] = useState(initial);
  const [draft, setDraft] = useState("");
  const [resolveAfter, setResolveAfter] = useState(true);

  const send = () => {
    if (!draft.trim()) return;
    const now = new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
    setMessages((ms) => [
      ...ms,
      { kind: "support", who: "Поддержка · Айдана С.", time: now, text: draft.trim() },
      ...(resolveAfter ? [{ kind: "system" as const, who: "Система", time: now, text: "Статус изменён на «Решено» · Айдана С." }] : []),
    ]);
    setDraft("");
  };

  return (
    <Card className="flex flex-col overflow-hidden">
      <div className="flex flex-col gap-3.5 p-[18px]">
        {messages.map((m, i) => (
          <Message key={i} m={m} />
        ))}
      </div>
      <div className="border-t border-neutral-100 bg-neutral-50 px-[18px] py-3.5">
        <div className="flex flex-col gap-2.5 rounded-[14px] border border-neutral-200 bg-white px-3.5 py-3">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Ответ пользователю…"
            rows={2}
            className="resize-none border-0 bg-transparent font-sans text-sm outline-none placeholder:text-neutral-400"
          />
          <div className="flex items-center gap-2">
            <Button size="xs" icon="paperclip" className="font-normal">
              Вложение
            </Button>
            <Button size="xs" icon="template" className="font-normal">
              Шаблон
            </Button>
            <div className="flex-1" />
            <label className="flex items-center gap-1.5 text-xs text-neutral-500">
              <input type="checkbox" checked={resolveAfter} onChange={(e) => setResolveAfter(e.target.checked)} className="accent-brand" />
              Решить после отправки
            </label>
            <Button size="sm" variant="primary" className="px-4" disabled={!draft.trim()} onClick={send}>
              Отправить
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
