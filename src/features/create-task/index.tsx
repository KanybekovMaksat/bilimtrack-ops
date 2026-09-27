import { useState } from "react";
import {
  TASK_COLUMNS,
  TASK_ESTIMATES,
  TASK_PEOPLE,
  TASK_PRIORITIES,
  TASK_TYPES,
  useTasks,
  type TaskColumn,
  type TaskPriority,
  type TaskType,
} from "@/entities/task";
import { cn } from "@/shared/lib";
import { Avatar, Button, Icon, Modal, ModalActions, Segmented, TextArea, TextInput } from "@/shared/ui";

/** `column` = the board column the modal was opened from; null = closed. */
type Props = { column: TaskColumn | null; onClose: () => void };

const Label = ({ children }: { children: string }) => <span className="text-xs font-semibold text-neutral-500">{children}</span>;

export function CreateTaskModal({ column, onClose }: Props) {
  if (column === null) return null;
  // Keyed by column so the form starts fresh every time it opens.
  return <CreateTaskForm key={column} column={column} onClose={onClose} />;
}

function CreateTaskForm({ column, onClose }: { column: TaskColumn; onClose: () => void }) {
  const nextKey = useTasks((s) => `OPS-${s.nextNumber}`);
  const add = useTasks((s) => s.add);
  const [draft, setDraft] = useState({ title: "", type: "Задача" as TaskType, priority: "Обычный" as TaskPriority, who: "АС", estimate: "3", column, tags: "", desc: "" });

  const set = (patch: Partial<typeof draft>) => setDraft((d) => ({ ...d, ...patch }));
  const ok = draft.title.trim().length > 0;

  const create = () => {
    if (!ok) return;
    add({
      title: draft.title.trim(),
      type: draft.type,
      priority: draft.priority,
      who: draft.who,
      estimate: draft.estimate,
      column: draft.column,
      tags: draft.tags.split(",").map((t) => t.trim()).filter(Boolean),
    });
    onClose();
  };

  return (
    <Modal open onClose={onClose} width={600} className="gap-4">
      <div className="flex items-center gap-2.5">
        <div className="flex-1 text-[17px] font-semibold">Новая задача</div>
        <span className="font-num text-xs text-neutral-400">{nextKey}</span>
        <Button variant="ghost" size="sm" icon="x" onClick={onClose} aria-label="Закрыть" />
      </div>
      <label className="flex flex-col gap-1.5">
        <Label>Заголовок · обязательно</Label>
        <TextInput look="plain" value={draft.title} onChange={(e) => set({ title: e.target.value })} placeholder="Что нужно сделать" autoFocus />
      </label>
      <div className="flex flex-col gap-2">
        <Label>Тип</Label>
        <Segmented<TaskType>
          value={draft.type}
          onChange={(type) => set({ type })}
          options={TASK_TYPES.map((t) => ({ value: t.type, label: t.type, icon: t.icon, iconColor: t.color }))}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label>Приоритет</Label>
        <Segmented<TaskPriority> value={draft.priority} onChange={(priority) => set({ priority })} options={TASK_PRIORITIES.map((p) => ({ value: p, label: p }))} />
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-4">
        <div className="flex flex-col gap-2">
          <Label>Исполнитель</Label>
          <div className="flex flex-wrap gap-1.5">
            {TASK_PEOPLE.map((p) => {
              const on = draft.who === p.initials;
              return (
                <button
                  key={p.initials}
                  onClick={() => set({ who: p.initials })}
                  className={cn(
                    "flex h-8 items-center gap-1.5 rounded-full border pr-2.5 pl-1 text-[13px] font-medium",
                    on ? "border-brand bg-brand-50 text-brand" : "border-neutral-200 bg-white text-neutral-700",
                  )}
                >
                  <Avatar initials={p.initials} size={24} tone="brand" className="text-[9px]" />
                  {p.name}
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Label>Оценка</Label>
          <Segmented value={draft.estimate} onChange={(estimate) => set({ estimate })} options={TASK_ESTIMATES.map((e) => ({ value: e, label: e }))} />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label>Колонка</Label>
        <Segmented<TaskColumn> value={draft.column} onChange={(c) => set({ column: c })} options={TASK_COLUMNS.map((c) => ({ value: c.key, label: c.label }))} />
      </div>
      <label className="flex flex-col gap-1.5">
        <Label>Метки через запятую</Label>
        <TextInput look="plain" value={draft.tags} onChange={(e) => set({ tags: e.target.value })} placeholder="поддержка, журнал" />
      </label>
      <label className="flex flex-col gap-1.5">
        <Label>Описание</Label>
        <TextArea look="plain" className="min-h-20" value={draft.desc} onChange={(e) => set({ desc: e.target.value })} placeholder="Контекст, шаги воспроизведения, ссылка на тикет" />
      </label>
      <ModalActions>
        <Button size="xl" onClick={onClose}>
          Отмена
        </Button>
        <Button size="xl" variant="primary" disabled={!ok} onClick={create}>
          <Icon name="plus" size={16} />
          Создать задачу
        </Button>
      </ModalActions>
    </Modal>
  );
}
