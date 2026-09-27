import { Card } from "@/shared/ui";

type Level = { l: string; bg: string; fg: string; fw: number; dot: boolean; bd: string; bars?: number };

const VARIANTS: { id: string; title: string; note: string; rows: Level[] }[] = [
  {
    id: "A",
    title: "Вариант A — только верх шкалы кричит",
    note: "Критический — сплошная заливка, высокий — тёплая плашка, остальные почти текст. Рекомендую: в очереди из 23 строк глаз цепляется ровно за то, что горит.",
    rows: [
      { l: "Критический", bg: "#fb2c36", fg: "#fff", fw: 600, dot: false, bd: "transparent" },
      { l: "Высокий", bg: "#fff7ed", fg: "#c2410c", fw: 600, dot: true, bd: "transparent" },
      { l: "Средний", bg: "#fff", fg: "#525252", fw: 500, dot: true, bd: "#e5e5e5" },
      { l: "Обычный", bg: "transparent", fg: "#737373", fw: 400, dot: false, bd: "transparent" },
      { l: "Низкий", bg: "transparent", fg: "#a1a1a1", fw: 400, dot: false, bd: "transparent" },
    ],
  },
  {
    id: "B",
    title: "Вариант B — пятиступенчатая шкала слева",
    note: "Цвет один, читается уровень заполнения. Тише в длинном списке, но «критический» узнаётся не мгновенно.",
    rows: [
      { l: "Критический", bg: "transparent", fg: "#fb2c36", fw: 600, dot: false, bd: "transparent", bars: 5 },
      { l: "Высокий", bg: "transparent", fg: "#0a0a0a", fw: 500, dot: false, bd: "transparent", bars: 4 },
      { l: "Средний", bg: "transparent", fg: "#404040", fw: 400, dot: false, bd: "transparent", bars: 3 },
      { l: "Обычный", bg: "transparent", fg: "#737373", fw: 400, dot: false, bd: "transparent", bars: 2 },
      { l: "Низкий", bg: "transparent", fg: "#a1a1a1", fw: 400, dot: false, bd: "transparent", bars: 1 },
    ],
  },
  {
    id: "C",
    title: "Вариант C — две группы",
    note: "Срочные (критический, высокий) — плашка, остальные — серый текст с точкой. Меньше всего шума, но теряется разница между обычным и низким.",
    rows: [
      { l: "Критический", bg: "#fef2f2", fg: "#e7000b", fw: 600, dot: true, bd: "#fb2c36" },
      { l: "Высокий", bg: "#fef2f2", fg: "#e7000b", fw: 500, dot: true, bd: "transparent" },
      { l: "Средний", bg: "transparent", fg: "#525252", fw: 400, dot: true, bd: "transparent" },
      { l: "Обычный", bg: "transparent", fg: "#737373", fw: 400, dot: true, bd: "transparent" },
      { l: "Низкий", bg: "transparent", fg: "#a1a1a1", fw: 400, dot: true, bd: "transparent" },
    ],
  },
];

/** Design decision record: three candidate priority scales; A is used in the ticket queue. */
export function TicketPriorityPage() {
  return (
    <div className="flex max-w-[1100px] flex-col gap-[18px]">
      <div>
        <h1 className="m-0 mb-1 text-xl leading-[26px] font-semibold tracking-[-.01em]">Шкала приоритетов — три варианта</h1>
        <div className="text-[13px] text-neutral-500">Пять уровней — много для цвета. Задача: критический и высокий читаются мгновенно, остальные не шумят.</div>
      </div>
      <div className="grid grid-cols-3 items-start gap-4">
        {VARIANTS.map((v) => (
          <Card key={v.id} className="overflow-hidden">
            <div className="border-b border-neutral-100 px-4 py-3.5 text-sm font-semibold">{v.title}</div>
            <div className="flex flex-col gap-3 px-4 py-3.5">
              {v.rows.map((r) => (
                <div key={r.l} className="flex items-center gap-2.5">
                  {r.bars && (
                    <span className="flex h-3.5 items-end gap-0.5">
                      {Array.from({ length: 5 }, (_, k) => (
                        <span key={k} className="h-3.5 w-[3px] rounded-sm" style={{ background: k < (r.bars ?? 0) ? r.fg : "#e5e5e5" }} />
                      ))}
                    </span>
                  )}
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-[3px] text-xs"
                    style={{ background: r.bg, color: r.fg, fontWeight: r.fw, borderColor: r.bd }}
                  >
                    {r.dot && <span className="size-1.5 rounded-full" style={{ background: r.fg }} />}
                    {r.l}
                  </span>
                </div>
              ))}
              <div className="border-t border-neutral-50 pt-3 text-xs leading-[18px] text-neutral-500">{v.note}</div>
            </div>
          </Card>
        ))}
      </div>
      <p className="m-0 text-[13px] text-neutral-700">
        В очереди тикетов сейчас применён <b>вариант A</b>.
      </p>
    </div>
  );
}
