import { useState } from "react";
import { useSession } from "@/entities/session";
import {
  TASK_ESTIMATES,
  TASK_PRIORITIES,
  TASK_TYPES,
  useAddComment,
  useCreateTask,
  useDeleteComment,
  useDeleteTask,
  useOperators,
  useTaskComments,
  useUpdateTask,
  type Board,
  type Task,
  type TaskPriority,
  type TaskType,
} from "@/entities/task";
import { cn, formatDate, formatDateTimeShort, initialsOf } from "@/shared/lib";
import { Avatar, Button, Callout, Modal, ModalActions, Segmented, TextArea, TextInput } from "@/shared/ui";

/** `task` — edit an existing task; `columnId` — create a new one in that column. */
export type TaskEditorTarget = { task: Task } | { columnId: number } | null;

const Label = ({ children }: { children: string }) => <span className="text-xs font-semibold text-neutral-500">{children}</span>;

export function TaskEditorModal({ board, target, onClose }: { board: Board; target: TaskEditorTarget; onClose: () => void }) {
  if (target === null) return null;
  const key = "task" in target ? `t${target.task.id}` : `c${target.columnId}`;
  return <TaskEditor key={key} board={board} target={target} onClose={onClose} />;
}

function TaskEditor({ board, target, onClose }: { board: Board; target: NonNullable<TaskEditorTarget>; onClose: () => void }) {
  const existing = "task" in target ? target.task : null;
  const operators = useOperators();
  const create = useCreateTask(board.id);
  const update = useUpdateTask(board.id);
  const remove = useDeleteTask(board.id);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [draft, setDraft] = useState({
    title: existing?.title ?? "",
    description: existing?.description ?? "",
    type: existing?.type ?? ("task" as TaskType),
    priority: existing?.priority ?? ("normal" as TaskPriority),
    assigneeId: existing ? (existing.assignee?.id ?? null) : null,
    estimate: existing?.estimate ?? null,
    columnId: existing?.column.id ?? ("columnId" in target ? target.columnId : board.columns[0]?.id),
    tags: existing?.tags.join(", ") ?? "",
    dueDate: existing?.dueDate ?? "",
  });
  const set = (patch: Partial<typeof draft>) => setDraft((d) => ({ ...d, ...patch }));
  const ok = draft.title.trim().length > 0;
  const pending = create.isPending || update.isPending;
  const error = create.error ?? update.error ?? remove.error;

  const save = () => {
    if (!ok) return;
    const input = {
      title: draft.title.trim(),
      description: draft.description,
      type: draft.type,
      priority: draft.priority,
      assigneeId: draft.assigneeId,
      estimate: draft.estimate,
      columnId: draft.columnId,
      tags: draft.tags.split(",").map((t) => t.trim()).filter(Boolean),
      dueDate: draft.dueDate || null,
    };
    if (existing) update.mutate({ id: existing.id, ...input }, { onSuccess: onClose });
    else create.mutate(input, { onSuccess: onClose });
  };

  return (
    <Modal open onClose={onClose} width={existing ? 760 : 620} className="gap-4">
      <div className="flex items-center gap-2.5">
        <div className="flex-1 text-[17px] font-semibold">{existing ? "Задача" : "Новая задача"}</div>
        <span className="font-num text-xs text-neutral-400">{existing?.key ?? `${board.key}-…`}</span>
        <Button variant="ghost" size="sm" icon="x" onClick={onClose} aria-label="Закрыть" />
      </div>
      <label className="flex flex-col gap-1.5">
        <Label>Заголовок · обязательно</Label>
        <TextInput look="plain" value={draft.title} onChange={(e) => set({ title: e.target.value })} placeholder="Что нужно сделать" autoFocus={!existing} />
      </label>
      <div className="flex flex-wrap gap-4">
        <div className="flex flex-col gap-2">
          <Label>Тип</Label>
          <Segmented<TaskType>
            value={draft.type}
            onChange={(type) => set({ type })}
            options={TASK_TYPES.map((t) => ({ value: t.value, label: t.label, icon: t.icon, iconColor: t.color }))}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Приоритет</Label>
          <Segmented<TaskPriority> value={draft.priority} onChange={(priority) => set({ priority })} options={TASK_PRIORITIES.map((p) => ({ value: p.value, label: p.label }))} />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label>Исполнитель</Label>
        <div className="flex flex-wrap gap-1.5">
          <PersonChip on={draft.assigneeId === null} onClick={() => set({ assigneeId: null })} label="Без исполнителя" />
          {(operators.data ?? []).map((p) => (
            <PersonChip key={p.id} on={draft.assigneeId === p.id} onClick={() => set({ assigneeId: p.id })} label={p.fullName} initials={initialsOf(p.fullName)} />
          ))}
          {operators.isLoading && <span className="text-xs text-neutral-400">Загружаем команду…</span>}
        </div>
      </div>
      <div className="flex flex-wrap gap-4">
        <div className="flex flex-col gap-2">
          <Label>Колонка</Label>
          <Segmented<string> value={String(draft.columnId)} onChange={(c) => set({ columnId: Number(c) })} options={board.columns.map((c) => ({ value: String(c.id), label: c.name }))} />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Оценка</Label>
          <Segmented<string>
            value={draft.estimate == null ? "" : String(draft.estimate)}
            onChange={(v) => set({ estimate: v ? Number(v) : null })}
            options={[{ value: "", label: "—" }, ...TASK_ESTIMATES.map((e) => ({ value: String(e), label: String(e) }))]}
          />
        </div>
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)_180px] gap-3">
        <label className="flex flex-col gap-1.5">
          <Label>Метки через запятую</Label>
          <TextInput look="plain" value={draft.tags} onChange={(e) => set({ tags: e.target.value })} placeholder="поддержка, журнал" />
        </label>
        <label className="flex flex-col gap-1.5">
          <Label>Срок</Label>
          <TextInput look="plain" type="date" value={draft.dueDate} onChange={(e) => set({ dueDate: e.target.value })} />
        </label>
      </div>
      <label className="flex flex-col gap-1.5">
        <Label>Описание</Label>
        <TextArea look="plain" className="min-h-24" value={draft.description} onChange={(e) => set({ description: e.target.value })} placeholder="Контекст, шаги воспроизведения, ссылка на тикет" />
      </label>
      {existing && (
        <div className="text-[11px] text-neutral-400">
          Создал {existing.reporter?.fullName ?? "—"} · {formatDateTimeShort(existing.createdAt)} · изменена {formatDateTimeShort(existing.updatedAt)}
          {existing.completedAt && ` · выполнена ${formatDate(existing.completedAt)}`}
        </div>
      )}
      {error && <div className="rounded-xl bg-red-50 px-3.5 py-2.5 text-xs text-red-600">{error.message}</div>}

      {confirmDelete && existing ? (
        <Callout tone="danger">
          <div className="flex items-center gap-2">
            <span className="flex-1">Удалить {existing.key} вместе с комментариями? Номер больше не будет выдан.</span>
            <Button size="xs" onClick={() => setConfirmDelete(false)}>
              Отмена
            </Button>
            <Button size="xs" variant="danger" disabled={remove.isPending} onClick={() => remove.mutate(existing.id, { onSuccess: onClose })}>
              Удалить
            </Button>
          </div>
        </Callout>
      ) : (
        <ModalActions>
          {existing && (
            <Button size="xl" variant="dangerOutline" icon="trash" onClick={() => setConfirmDelete(true)} className="mr-auto">
              Удалить
            </Button>
          )}
          <Button size="xl" onClick={onClose}>
            Отмена
          </Button>
          <Button size="xl" variant="primary" disabled={!ok || pending} onClick={save}>
            {pending ? "Сохраняем…" : existing ? "Сохранить" : "Создать задачу"}
          </Button>
        </ModalActions>
      )}

      {existing && <Comments boardId={board.id} taskId={existing.id} />}
    </Modal>
  );
}

function PersonChip({ on, onClick, label, initials }: { on: boolean; onClick: () => void; label: string; initials?: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex h-8 items-center gap-1.5 rounded-full border pr-2.5 text-[13px] font-medium",
        initials ? "pl-1" : "pl-2.5",
        on ? "border-brand bg-brand-50 text-brand" : "border-neutral-200 bg-white text-neutral-700",
      )}
    >
      {initials && <Avatar initials={initials} size={24} tone="brand" className="text-[9px]" />}
      {label}
    </button>
  );
}

function Comments({ boardId, taskId }: { boardId: number; taskId: number }) {
  const me = useSession((s) => s.user);
  const comments = useTaskComments(taskId);
  const add = useAddComment(boardId, taskId);
  const remove = useDeleteComment(boardId, taskId);
  const [text, setText] = useState("");

  return (
    <div className="flex flex-col gap-2.5 border-t border-neutral-100 pt-4">
      <div className="text-sm font-semibold">Комментарии {comments.data ? `· ${comments.data.length}` : ""}</div>
      {(comments.data ?? []).map((c) => (
        <div key={c.id} className="flex gap-2.5">
          <Avatar initials={initialsOf(c.author?.fullName ?? "?")} size={28} tone="brand" className="text-[10px]" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-medium">{c.author?.fullName ?? "Удалённый аккаунт"}</span>
              <span className="text-neutral-400">{formatDateTimeShort(c.createdAt)}</span>
              {c.author?.id === me?.id && (
                <button onClick={() => remove.mutate(c.id)} className="border-0 bg-transparent p-0 text-[11px] text-neutral-400 hover:text-red-600">
                  удалить
                </button>
              )}
            </div>
            <div className="text-[13px] leading-5 whitespace-pre-line">{c.text}</div>
          </div>
        </div>
      ))}
      {comments.isLoading && <div className="h-10 animate-pulse rounded-lg bg-neutral-50" />}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (text.trim()) add.mutate(text.trim(), { onSuccess: () => setText("") });
        }}
        className="flex items-end gap-2"
      >
        <TextArea className="min-h-[44px] flex-1" value={text} onChange={(e) => setText(e.target.value)} placeholder="Написать комментарий" />
        <Button type="submit" variant="primary" icon="send" disabled={!text.trim() || add.isPending} aria-label="Отправить" />
      </form>
      {add.error && <div className="text-xs text-red-600">{add.error.message}</div>}
    </div>
  );
}
