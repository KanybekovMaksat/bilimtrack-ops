import { useState } from "react";
import { useIdeas, type IdeaStatus } from "@/entities/idea";
import { Avatar, Button, Card, FilterChip, Icon, OrgMark, PageHeader, Pill } from "@/shared/ui";

export function IdeasPage() {
  const seed = useIdeas();
  const [status, setStatus] = useState<Record<number, IdeaStatus>>(() => Object.fromEntries(seed.map((i) => [i.id, i.status])));

  return (
    <div className="flex max-w-[820px] flex-col gap-4">
      <PageHeader title="Идеи" subtitle="предложения по продукту · без SLA и переписки" />
      <div className="flex items-center gap-2">
        <FilterChip label="Период" />
        <FilterChip label="Организация" />
        <div className="flex-1" />
        <span className="text-xs text-neutral-400">Новые сверху</span>
      </div>
      {seed.map((idea) => {
        const st = status[idea.id];
        return (
          <Card key={idea.id} className="flex flex-col gap-3 p-4">
            <div className="flex items-center gap-2.5">
              <Avatar initials={idea.initials} size={32} className="text-[11px]" />
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-medium text-brand">{idea.author}</div>
                <div className="flex items-center gap-1.5 text-[11px] text-neutral-400">
                  {idea.role} ·
                  <span className="inline-flex items-center gap-[5px]">
                    <OrgMark short={idea.orgShort} size={16} />
                    {idea.org}
                  </span>
                </div>
              </div>
              {st && (
                <Pill size="lg" tone={st === "Взято в работу" ? "info" : "neutral"}>
                  {st}
                </Pill>
              )}
              <span className="text-[11px] text-neutral-400">{idea.time}</span>
            </div>
            <div className="text-sm leading-[21px]">{idea.text}</div>
            {idea.screenshots > 0 && (
              <div className="flex gap-2">
                {Array.from({ length: idea.screenshots }, (_, k) => (
                  <div key={k} className="flex h-16 w-24 cursor-pointer items-center justify-center rounded-[10px] border border-neutral-200 bg-neutral-100 text-neutral-400 hover:border-brand">
                    <Icon name="photo" size={20} />
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-1.5 border-t border-neutral-50 pt-2.5">
              <Button size="xs" onClick={() => setStatus((s) => ({ ...s, [idea.id]: "Взято в работу" }))} disabled={st === "Взято в работу"}>
                Взять в работу
              </Button>
              <Button size="xs" variant="muted" className="font-normal" onClick={() => setStatus((s) => ({ ...s, [idea.id]: "Отклонено" }))} disabled={st === "Отклонено"}>
                Отклонить
              </Button>
            </div>
          </Card>
        );
      })}
      <p className="m-0 text-xs leading-[18px] text-neutral-400">
        Пометки «Взято в работу / Отклонено» — предложение. Сейчас статусов у идеи на бэке нет; если подойдёт, добавляем поле status и две кнопки внизу карточки.
      </p>
    </div>
  );
}
