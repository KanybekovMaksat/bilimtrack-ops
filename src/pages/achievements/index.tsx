import { useState } from "react";
import { CATEGORY_LABEL, useAchievements, useUpdateAchievement, type Achievement, type AchievementCategory } from "@/entities/achievement";
import { useCan } from "@/entities/session";
import { AchievementFormModal } from "@/features/manage-achievement";
import { formatDayMonth, formatInt, formatPercent } from "@/shared/lib";
import { Button, Callout, Cell, EmptyState, ErrorNote, PageHeader, Pill, Row, Table, Toggle } from "@/shared/ui";

const CATEGORY_ORDER = Object.keys(CATEGORY_LABEL) as AchievementCategory[];

/** «Набрать 100 баллов · 1 сен — 30 сен» / «Привязан Telegram». */
function condition(a: Achievement) {
  if (a.metric !== "points") return a.metricLabel;
  const period =
    a.periodStart || a.periodEnd
      ? ` · ${a.periodStart ? formatDayMonth(a.periodStart) : "…"} — ${a.periodEnd ? formatDayMonth(a.periodEnd) : "…"}`
      : "";
  return `Набрать ${formatInt(a.thresholdPoints)} баллов${period}`;
}

export function AchievementsPage() {
  const achievements = useAchievements();
  const can = useCan();
  const editable = can("gamification");
  const toggle = useUpdateAchievement();
  const [editing, setEditing] = useState<Achievement | "new" | null>(null);

  const active = achievements.filter((a) => a.isActive).length;
  const learners = achievements[0]?.learnersTotal ?? 0;
  const groups = CATEGORY_ORDER.map((category) => ({
    category,
    items: achievements.filter((a) => a.category === category),
  })).filter((g) => g.items.length);

  return (
    <div className="flex max-w-[1180px] flex-col gap-4">
      <PageHeader
        title="Достижения"
        subtitle="каталог платформы · действует во всех организациях"
        actions={
          editable && (
            <Button variant="primary" icon="plus" onClick={() => setEditing("new")}>
              Новое достижение
            </Button>
          )
        }
      />

      <div className="grid grid-cols-3 gap-3.5">
        {[
          ["Достижений в каталоге", formatInt(achievements.length)],
          ["Включено", formatInt(active)],
          ["Студентов с аккаунтом", formatInt(learners)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-neutral-200 bg-white px-4 py-3">
            <div className="font-num text-lg font-semibold">{value}</div>
            <div className="text-[11px] text-neutral-400">{label}</div>
          </div>
        ))}
      </div>

      <ErrorNote error={toggle.error} prefix="Не удалось переключить" />

      {achievements.length ? (
        groups.map(({ category, items }) => (
          <div key={category} className="flex flex-col gap-2">
            <div className="text-[13px] font-semibold text-neutral-600">{CATEGORY_LABEL[category]}</div>
            <Table
              cols="minmax(260px,2.2fr) minmax(200px,1.6fr) 120px 110px 64px 44px"
              minWidth={900}
              head={["Достижение", "Условие", "Получили", "За 30 дней", "Вкл.", ""]}
              headAlign={["left", "left", "right", "right", "center", "right"]}
            >
              {items.map((a) => (
                <Row key={a.id} hover className={a.isActive ? undefined : "opacity-60"}>
                  <Cell title={a.description}>
                    <div className="flex items-center gap-2">
                      <span className="truncate font-medium">{a.title}</span>
                      {a.isSystem && <Pill tone="neutral" size="sm">системное</Pill>}
                    </div>
                    <div className="truncate text-xs text-neutral-500">{a.description || "—"}</div>
                  </Cell>
                  <Cell className="text-[13px] text-neutral-600">{condition(a)}</Cell>
                  <Cell className="text-right">
                    <div className="font-num font-medium">{formatInt(a.earned)}</div>
                    <div className="text-[11px] text-neutral-400">{formatPercent(a.earnedShare / 100)} студентов</div>
                  </Cell>
                  <Cell className="text-right font-num">{formatInt(a.earnedLast30Days)}</Cell>
                  <span className="flex justify-center">
                    <Toggle
                      on={a.isActive}
                      label={a.isActive ? "Выключить" : "Включить"}
                      disabled={!editable || toggle.isPending}
                      onChange={(isActive) => toggle.mutate({ id: a.id, input: { isActive } })}
                    />
                  </span>
                  <span className="flex justify-end">
                    {editable && <Button size="sm" variant="ghost" icon="pencil" aria-label={`Изменить «${a.title}»`} onClick={() => setEditing(a)} />}
                  </span>
                </Row>
              ))}
            </Table>
          </div>
        ))
      ) : (
        <EmptyState icon="trophy" title="Каталог пуст" description="Создайте первое достижение — оно сразу появится у студентов всех организаций." />
      )}

      <Callout tone="muted" icon="info-circle" iconClassName="text-neutral-400" className="text-neutral-500">
        Выключение и правка действуют сразу во всех организациях. Уже выданные достижения у студентов не забираются. Удалить можно только то, что ещё никто не получил.
      </Callout>

      {editing && <AchievementFormModal achievement={editing === "new" ? undefined : editing} onClose={() => setEditing(null)} />}
    </div>
  );
}
