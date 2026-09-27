import { useRef, useState, type DragEvent } from "react";
import { priorityStyle, typeGlyph, useMoveTask, type Board, type Task } from "@/entities/task";
import { cn, formatDate, initialsOf } from "@/shared/lib";
import { Avatar, Icon } from "@/shared/ui";

type DropTarget = { column: number; before: number | null } | null;

function Slot() {
  return <div className="-my-[5px] -mb-0.5 h-[3px] rounded-full bg-brand" />;
}

function TaskCard({ task, dragging, onOpen, onDragStart, onDragEnd, onDragOver, onDrop }: {
  task: Task;
  dragging: boolean;
  onOpen: () => void;
  onDragStart: (e: DragEvent) => void;
  onDragEnd: () => void;
  onDragOver: (e: DragEvent) => void;
  onDrop: (e: DragEvent) => void;
}) {
  const g = typeGlyph(task.type);
  const p = priorityStyle(task.priority);
  const overdue = !!task.dueDate && !task.completedAt && new Date(task.dueDate) < new Date(new Date().toDateString());
  return (
    <div
      draggable
      onClick={onOpen}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={cn(
        "flex cursor-grab flex-col gap-[9px] rounded-xl border border-neutral-200 bg-white p-3 select-none hover:border-brand active:cursor-grabbing",
        dragging && "opacity-40",
      )}
    >
      <div className={cn("text-[13px] leading-[19px] font-medium", task.completedAt && "text-neutral-500")}>{task.title}</div>
      {(task.tags.length > 0 || task.dueDate) && (
        <div className="flex flex-wrap gap-[5px]">
          {task.dueDate && (
            <span className={cn("flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px]", overdue ? "bg-red-50 text-red-600" : "bg-neutral-100 text-neutral-500")}>
              <Icon name="calendar" size={11} />
              {formatDate(task.dueDate)}
            </span>
          )}
          {task.tags.map((t) => (
            <span key={t} className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] text-neutral-500">
              {t}
            </span>
          ))}
        </div>
      )}
      <div className="flex items-center gap-2 border-t border-neutral-50 pt-[9px]">
        <span title={g.label} className="flex items-center gap-1 text-[11px] text-neutral-500">
          <Icon name={g.icon} size={15} style={{ color: g.color }} />
          {g.label}
        </span>
        <span className="rounded-full px-2 py-px text-[11px] font-medium" style={{ background: p.bg, color: p.fg }}>
          {task.priorityLabel}
        </span>
        <div className="flex-1" />
        {task.commentsCount > 0 && (
          <span className="flex items-center gap-0.5 text-[11px] text-neutral-400">
            <Icon name="message" size={12} />
            {task.commentsCount}
          </span>
        )}
        {task.assignee ? (
          <span title={task.assignee.fullName}>
            <Avatar initials={initialsOf(task.assignee.fullName)} size={22} tone="brand" className="text-[9px]" />
          </span>
        ) : (
          <span title="Без исполнителя">
            <Avatar icon="user" size={22} />
          </span>
        )}
      </div>
    </div>
  );
}

type Props = {
  board: Board;
  /** Tasks to show (already filtered); drag-and-drop still moves them on the server. */
  tasks: Task[];
  onAdd: (columnId: number) => void;
  onOpen: (task: Task) => void;
};

/** Kanban board with native drag-and-drop between and within columns. */
export function TaskBoard({ board, tasks, onAdd, onOpen }: Props) {
  const move = useMoveTask(board);
  const dragId = useRef<number | null>(null);
  const [dragging, setDragging] = useState<number | null>(null);
  const [target, setTarget] = useState<DropTarget>(null);

  const reset = () => {
    dragId.current = null;
    setDragging(null);
    setTarget(null);
  };
  const drop = (column: number, before: number | null) => {
    const id = dragId.current;
    if (id !== null && id !== before) {
      const task = tasks.find((t) => t.id === id);
      const colTasks = tasks.filter((t) => t.column.id === column);
      const sameSpot = task?.column.id === column && (before === null ? colTasks.at(-1)?.id === id : colTasks[colTasks.findIndex((t) => t.id === before) - 1]?.id === id);
      if (!sameSpot) move.mutate({ id, columnId: column, beforeId: before });
    }
    reset();
  };

  return (
    <div className="flex flex-col gap-2">
      {move.error && <div className="rounded-xl bg-red-50 px-3.5 py-2.5 text-xs text-red-600">Задача не перенесена: {move.error.message}</div>}
      <div className="grid items-start gap-3" style={{ gridTemplateColumns: `repeat(${board.columns.length}, minmax(240px, 1fr))` }}>
        {board.columns.map((c) => {
          const items = tasks.filter((t) => t.column.id === c.id);
          const over = dragging !== null && target?.column === c.id;
          return (
            <div
              key={c.id}
              onDragOver={(e) => {
                e.preventDefault();
                if (target?.column !== c.id || target.before) setTarget({ column: c.id, before: null });
              }}
              onDrop={(e) => {
                e.preventDefault();
                drop(c.id, null);
              }}
              className={cn(
                "flex min-h-[280px] flex-col gap-2.5 rounded-2xl p-3 transition-colors",
                over ? "bg-brand-50 shadow-[inset_0_0_0_1px_#155dfc]" : "bg-neutral-50",
              )}
            >
              <div className="flex items-center gap-2 px-1">
                <span className="size-[7px] rounded-full" style={{ background: c.color }} />
                <span className="text-[13px] font-semibold">{c.name}</span>
                <span className="text-[11px] text-neutral-400">{items.length}</span>
                {c.isDone && <Icon name="check" size={13} className="text-green-600" />}
              </div>
              {!items.length && (
                <div className="rounded-xl border border-dashed border-neutral-200 p-[18px] text-center text-xs text-neutral-400">Перетащите задачу сюда</div>
              )}
              {items.map((t) => (
                <div key={t.id} className="contents">
                  {over && target?.before === t.id && dragging !== t.id && <Slot />}
                  <TaskCard
                    task={t}
                    dragging={dragging === t.id}
                    onOpen={() => onOpen(t)}
                    onDragStart={(e) => {
                      e.dataTransfer.effectAllowed = "move";
                      e.dataTransfer.setData("text/plain", t.title);
                      dragId.current = t.id;
                      setTimeout(() => setDragging(t.id), 0);
                    }}
                    onDragEnd={reset}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (target?.column !== c.id || target.before !== t.id) setTarget({ column: c.id, before: t.id });
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      drop(c.id, t.id);
                    }}
                  />
                </div>
              ))}
              {over && !target?.before && <Slot />}
              <button
                onClick={() => onAdd(c.id)}
                className="flex h-8 items-center justify-center gap-1.5 rounded-[10px] border border-dashed border-neutral-200 bg-transparent text-xs text-neutral-400 hover:bg-neutral-100"
              >
                <Icon name="plus" size={15} />
                Добавить
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
