import { useState } from "react";
import {
  CATEGORY_LABEL,
  useAchievementMetrics,
  useCreateAchievement,
  useDeleteAchievement,
  useUpdateAchievement,
  type Achievement,
  type AchievementCategory,
  type AchievementInput,
} from "@/entities/achievement";
import { Button, Callout, ErrorNote, Field, Modal, ModalActions, SelectInput, TextArea, TextInput, Toggle } from "@/shared/ui";

type Form = {
  title: string;
  description: string;
  metric: string;
  threshold: string;
  periodStart: string;
  periodEnd: string;
  category: AchievementCategory;
  sortOrder: string;
  isActive: boolean;
};

const EMPTY: Form = {
  title: "",
  description: "",
  metric: "points",
  threshold: "",
  periodStart: "",
  periodEnd: "",
  category: "study",
  sortOrder: "100",
  isActive: true,
};

const toForm = (a: Achievement): Form => ({
  title: a.title,
  description: a.description,
  metric: a.metric,
  threshold: a.thresholdPoints ? String(a.thresholdPoints) : "",
  periodStart: a.periodStart ?? "",
  periodEnd: a.periodEnd ?? "",
  category: a.category,
  sortOrder: String(a.sortOrder),
  isActive: a.isActive,
});

const CATEGORIES = Object.entries(CATEGORY_LABEL).map(([value, label]) => ({ value, label }));

/** Create (no `achievement`) or edit a catalog achievement. Changes apply to every organization. */
export function AchievementFormModal({ achievement, onClose }: { achievement?: Achievement; onClose: () => void }) {
  const [form, setForm] = useState<Form>(achievement ? toForm(achievement) : EMPTY);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const metrics = useAchievementMetrics().data ?? [];
  const create = useCreateAchievement();
  const update = useUpdateAchievement();
  const remove = useDeleteAchievement();
  const set = (patch: Partial<Form>) => setForm((f) => ({ ...f, ...patch }));

  const isFlag = metrics.find((m) => m.value === form.metric)?.kind === "flag";
  const threshold = Number(form.threshold || 0);
  const datesOk = !form.periodStart || !form.periodEnd || form.periodStart <= form.periodEnd;
  const valid = form.title.trim().length > 0 && (isFlag || threshold > 0) && datesOk;
  const locked = achievement?.isSystem ?? false;

  const input: AchievementInput = {
    title: form.title.trim(),
    description: form.description.trim(),
    metric: form.metric,
    thresholdPoints: isFlag ? 0 : threshold,
    periodStart: isFlag ? null : form.periodStart || null,
    periodEnd: isFlag ? null : form.periodEnd || null,
    category: form.category,
    isActive: form.isActive,
    sortOrder: Number(form.sortOrder || 0),
  };

  const save = () => {
    if (!valid) return;
    if (achievement) update.mutate({ id: achievement.id, input: locked ? { ...input, metric: undefined } : input }, { onSuccess: onClose });
    else create.mutate(input, { onSuccess: onClose });
  };
  const mutation = achievement ? update : create;
  const digits = (v: string) => v.replace(/[^\d]/g, "");

  return (
    <Modal open onClose={onClose} width={560} title={achievement ? `Достижение «${achievement.title}»` : "Новое достижение"}>
      <Field label="Название (видят студенты)" strong>
        <TextInput inputSize="md" value={form.title} onChange={(e) => set({ title: e.target.value })} placeholder="Отличник месяца" />
      </Field>
      <Field label="Описание — что нужно сделать">
        <TextArea value={form.description} onChange={(e) => set({ description: e.target.value })} placeholder="Набрать 100 баллов за сентябрь" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Условие">
          <SelectInput
            value={form.metric}
            disabled={locked}
            onChange={(e) => set({ metric: e.target.value })}
            options={metrics.map((m) => ({ value: m.value, label: m.label }))}
          />
        </Field>
        <Field label="Раздел">
          <SelectInput value={form.category} onChange={(e) => set({ category: e.target.value as AchievementCategory })} options={CATEGORIES} />
        </Field>
        {!isFlag && (
          <>
            <Field label="Сколько баллов набрать">
              <TextInput inputSize="md" numeric value={form.threshold} onChange={(e) => set({ threshold: digits(e.target.value) })} placeholder="100" />
            </Field>
            <Field label="Порядок в списке">
              <TextInput inputSize="md" numeric value={form.sortOrder} onChange={(e) => set({ sortOrder: digits(e.target.value) })} />
            </Field>
            <Field label="Считать баллы с (необязательно)">
              <TextInput inputSize="md" type="date" value={form.periodStart} max={form.periodEnd || undefined} onChange={(e) => set({ periodStart: e.target.value })} />
            </Field>
            <Field label="по (необязательно)">
              <TextInput inputSize="md" type="date" value={form.periodEnd} min={form.periodStart || undefined} onChange={(e) => set({ periodEnd: e.target.value })} />
            </Field>
          </>
        )}
      </div>
      <div className="flex items-center gap-3 rounded-xl border border-neutral-100 px-3.5 py-3">
        <Toggle on={form.isActive} label="Включено" onChange={(isActive) => set({ isActive })} />
        <div className="flex-1 text-[13px]">
          <div className="font-medium">Включено</div>
          <div className="text-xs text-neutral-500">Выключенное не выдаётся и не видно студентам. Уже полученные остаются у студентов.</div>
        </div>
      </div>
      {isFlag && <Callout tone="muted">Это разовое условие: достижение выдаётся, как только оно выполнено. Порог и даты не нужны.</Callout>}
      {locked && <Callout tone="muted">Системное достижение: условие менять и удалять его нельзя — только текст и включение.</Callout>}
      {achievement && <Callout tone="warn">Изменения сразу применятся во всех организациях.</Callout>}
      <ErrorNote error={mutation.error ?? remove.error} />
      <ModalActions>
        {achievement && !locked && (
          <Button
            size="xl"
            variant={confirmDelete ? "danger" : "dangerOutline"}
            disabled={remove.isPending}
            onClick={() => (confirmDelete ? remove.mutate(achievement.id, { onSuccess: onClose }) : setConfirmDelete(true))}
          >
            {confirmDelete ? "Точно удалить?" : "Удалить"}
          </Button>
        )}
        <Button size="xl" onClick={onClose}>
          Отмена
        </Button>
        <Button size="xl" variant="primary" disabled={!valid || mutation.isPending} onClick={save}>
          {mutation.isPending ? "Сохраняем…" : achievement ? "Сохранить" : "Создать"}
        </Button>
      </ModalActions>
    </Modal>
  );
}
