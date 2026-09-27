import { useState } from "react";
import { CHANNEL_GLYPH, useDialogs } from "@/entities/channel";
import { cn } from "@/shared/lib";
import { Avatar, Button, Card, Icon } from "@/shared/ui";

export function InboxPage() {
  const dialogs = useDialogs();
  const [openId, setOpenId] = useState(0);
  const [extra, setExtra] = useState<Record<number, string[]>>({});
  const [draft, setDraft] = useState("");
  const current = dialogs.find((d) => d.id === openId) ?? dialogs[0];
  const glyph = CHANNEL_GLYPH[current.channel];

  const send = () => {
    if (!draft.trim()) return;
    setExtra((e) => ({ ...e, [current.id]: [...(e[current.id] ?? []), draft.trim()] }));
    setDraft("");
  };

  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex items-center gap-3">
        <h1 className="m-0 text-xl leading-[26px] font-semibold tracking-[-.01em]">Входящие</h1>
        <span className="text-[13px] text-neutral-400">все каналы в одной ленте · макет чата тот же, что у тикета</span>
      </div>
      <div className="grid grid-cols-[340px_minmax(0,1fr)] items-start gap-3.5">
        <Card className="overflow-hidden">
          <div className="flex gap-1.5 border-b border-neutral-100 px-3 py-2.5">
            {["Канал", "Обработан", "Ответственный"].map((f) => (
              <Button key={f} size="xs" className="font-normal">
                {f}
              </Button>
            ))}
          </div>
          {dialogs.map((d) => {
            const g = CHANNEL_GLYPH[d.channel];
            const unprocessed = d.tag === "Не обработан";
            return (
              <button
                key={d.id}
                onClick={() => setOpenId(d.id)}
                className={cn("flex w-full gap-2.5 border-0 border-b border-neutral-50 p-3 text-left hover:bg-neutral-50", d.id === openId ? "bg-neutral-100" : "bg-white")}
              >
                <div className="relative shrink-0">
                  <Avatar icon="user" size={34} />
                  <Icon name={g.icon} size={14} className="absolute -right-[3px] -bottom-0.5 rounded-full bg-white p-px" style={{ color: g.color }} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="flex-1 truncate text-[13px] font-medium">{d.name}</span>
                    <span className="text-[11px] text-neutral-400">{d.time}</span>
                  </div>
                  <div className="truncate text-xs text-neutral-500">{d.last}</div>
                  <span className={cn("mt-[5px] inline-block rounded-full px-2 py-0.5 text-[11px]", unprocessed ? "bg-amber-50 text-warn" : "bg-neutral-100 text-neutral-500")}>{d.tag}</span>
                </div>
              </button>
            );
          })}
        </Card>

        <Card className="flex flex-col overflow-hidden">
          <div className="flex items-center gap-2.5 border-b border-neutral-100 px-4 py-[13px]">
            <Icon name={glyph.icon} size={20} style={{ color: glyph.color }} />
            <div className="flex-1">
              <div className="text-sm font-medium">{current.name}</div>
              <div className="text-[11px] text-neutral-400">
                {glyph.label} · {current.tag.toLowerCase()}
              </div>
            </div>
            <Button size="sm" variant="primary" icon="inbox">
              Создать заявку
            </Button>
            <Button size="sm" icon="lifebuoy">
              Создать тикет
            </Button>
          </div>
          <div className="flex min-h-80 flex-col gap-3 p-[18px]">
            {[...current.messages, ...(extra[current.id] ?? []).map((text) => ({ from: "us" as const, text }))].map((m, i) => (
              <div key={i} className={cn("flex", m.from === "us" ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[70%] rounded-[14px] border px-[13px] py-[11px] text-sm leading-5",
                    m.from === "us" ? "border-brand-100 bg-brand-50" : "border-neutral-200 bg-white",
                  )}
                >
                  {m.text}
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-neutral-100 bg-neutral-50 px-[18px] py-3.5">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send();
              }}
              className="flex items-center gap-2.5 rounded-[14px] border border-neutral-200 bg-white px-3.5 py-3"
            >
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={`Ответить в ${glyph.label}…`}
                className="flex-1 border-0 bg-transparent font-sans text-sm outline-none placeholder:text-neutral-400"
              />
              <Button size="sm" icon="template" className="px-[11px] text-xs font-normal">
                Шаблон
              </Button>
              <Button type="submit" size="sm" variant="primary" className="px-4" disabled={!draft.trim()}>
                Отправить
              </Button>
            </form>
          </div>
        </Card>
      </div>
      <p className="m-0 text-xs text-neutral-400">Заявка из Direct попадает в общий список с источником Instagram — отдельного поля не нужно. Тикет сохраняет номер и всю историю переписки.</p>
    </div>
  );
}
