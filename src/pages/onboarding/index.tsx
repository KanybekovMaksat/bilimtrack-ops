import { useState } from "react";
import { useNavigate } from "react-router";
import { PLAYBOOK, PLAYBOOK_STEPS, initialChecklist, useChecklist, useOnboardings } from "@/entities/onboarding";
import { routes } from "@/shared/config";
import { cn } from "@/shared/lib";
import { Button, Card, Icon, Meter, OrgMark, PageHeader } from "@/shared/ui";

const TOTAL = PLAYBOOK_STEPS.length;

/** Index of each stage's first step in the flat playbook. */
const STAGE_START = PLAYBOOK.map((_, i) => PLAYBOOK.slice(0, i).reduce((a, g) => a + g.steps.length, 0));

export function OnboardingPage() {
  const list = useOnboardings();
  const navigate = useNavigate();
  const doneMap = useChecklist((s) => s.done);
  const toggle = useChecklist((s) => s.toggle);
  const [selected, setSelected] = useState(0);

  const doneOf = (i: number) => doneMap[i] ?? initialChecklist(list[i]);
  const current = list[selected];
  const done = doneOf(selected);
  const n = done.filter(Boolean).length;
  const firstOpen = done.indexOf(false);

  return (
    <div className="flex max-w-[1240px] flex-col gap-4">
      <PageHeader title="Онбординг" subtitle="подключение новых учреждений по плейбуку" />
      <div className="grid grid-cols-[340px_minmax(0,1fr)] items-start gap-4">
        <div className="flex flex-col gap-2">
          {list.map((o, i) => {
            const d = doneOf(i);
            const count = d.filter(Boolean).length;
            const next = PLAYBOOK_STEPS[d.indexOf(false)];
            return (
              <button
                key={o.name}
                onClick={() => setSelected(i)}
                className={cn("flex flex-col gap-2 rounded-[14px] border bg-white px-3.5 py-3 text-left", i === selected ? "border-brand" : "border-neutral-200")}
              >
                <div className="flex w-full items-center gap-2">
                  <OrgMark short={o.short} size={22} />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium">{o.name}</div>
                    <div className="text-[11px] text-neutral-400">
                      {o.kind} · {o.manager}
                    </div>
                  </div>
                  <span className="font-num text-[13px] font-semibold">
                    {count}/{TOTAL}
                  </span>
                </div>
                <Meter className="w-full" value={Math.round((count / TOTAL) * 100)} color={o.late ? "#fd9a00" : "#155dfc"} />
                <div className="flex w-full justify-between text-[11px]">
                  <span className="text-neutral-500">Этап: {next ? next.stage : "Запущен"}</span>
                  <span className={o.late ? "font-semibold text-red-600" : "text-neutral-400"}>{o.late ? `просрочен · срок ${o.due}` : `запуск до ${o.due}`}</span>
                </div>
              </button>
            );
          })}
        </div>

        <Card className="overflow-hidden">
          <div className="flex items-center gap-4 border-b border-neutral-100 px-[18px] py-4">
            <div className="min-w-0 flex-1">
              <div className="text-base font-semibold">{current.name}</div>
              <div className="mt-0.5 text-xs text-neutral-500">
                {current.kind} · менеджер {current.manager} · старт {current.start} · запуск до {current.due}
              </div>
            </div>
            <div className="text-right">
              <div className="font-num text-[22px] leading-[26px] font-semibold">{Math.round((n / TOTAL) * 100)}%</div>
              <div className="text-[11px] text-neutral-400">
                {n} из {TOTAL} шагов
              </div>
            </div>
            <Button onClick={() => navigate(routes.orgs)}>Карточка организации</Button>
          </div>
          <div className="flex flex-col px-[18px] pt-1 pb-4">
            {PLAYBOOK.map((g, gi) => {
              const start = STAGE_START[gi];
              const groupDone = done.slice(start, start + g.steps.length).filter(Boolean).length;
              return (
                <div key={g.stage} className="flex flex-col pt-3">
                  <div className="flex items-center justify-between px-2.5 pb-1.5">
                    <span className="text-xs font-semibold text-neutral-500">{g.stage}</span>
                    <span className="font-num text-[11px] text-neutral-400">
                      {groupDone} из {g.steps.length}
                    </span>
                  </div>
                  {g.steps.map((s, k) => {
                    const j = start + k;
                    const isDone = done[j];
                    const isNext = j === firstOpen;
                    return (
                      <button
                        key={s.title}
                        onClick={() => toggle(selected, j, done)}
                        className={cn("flex items-center gap-2.5 rounded-[10px] border-0 px-2.5 py-2 text-left", isNext ? "bg-neutral-50" : "bg-transparent")}
                      >
                        <Icon name={isDone ? "square-check-filled" : "square"} size={19} className={isDone ? "text-brand" : "text-neutral-300"} />
                        <span className={cn("flex-1 text-[13px]", isDone ? "text-neutral-500 line-through" : "text-ink")}>{s.title}</span>
                        {isNext && <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-medium text-brand">следующий шаг</span>}
                        <span className="w-[120px] text-right text-[11px] text-neutral-400">{s.owner}</span>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
