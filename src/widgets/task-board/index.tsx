import { useRef, useState, type DragEvent } from "react";
import { TASK_COLUMNS, priorityStyle, typeGlyph, useTasks, type Task, type TaskColumn } from "@/entities/task";
import { cn } from "@/shared/lib";
import { Avatar, Icon } from "@/shared/ui";

type DropTarget = { column: TaskColumn; before: string | null } | null;

function Slot() {
  return <div className="-my-[5px] -mb-0.5 h-[3px] rounded-full bg-brand" />;
}

function TaskCard({ task, dragging, onDragStart, onDragEnd, onDragOver, onDrop }: {
  task: Task;
  dragging: boolean;
  onDragStart: (e: DragEvent) => void;
  onDragEnd: () => void;
  onDragOver: (e: DragEvent) => void;
  onDrop: (e: DragEvent) => void;
}) {
  const g = typeGlyph(task.type);
  const p = priorityStyle(task.priority);
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={cn(
        "flex cursor-grab flex-col gap-[9px] rounded-xl border border-neutral-200 bg-white p-3 select-none hover:border-brand active:cursor-grabbing",
        dragging && "opacity-40",
      )}
    >
      <div className="text-[13px] leading-[19px] font-medium">{task.title}</div>
      {task.tags.length > 0 && (
        <div className="flex flex-wrap gap-[5px]">
          {task.tags.map((t) => (
            <span key={t} className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] text-neutral-500">
              {t}
            </span>
          ))}
        </div>
      )}
      <div className="flex items-center gap-2 border-t border-neutral-50 pt-[9px]">
        <Icon name={g.icon} size={15} style={{ color: g.color }} />
        <span className="font-num text-[11px] text-neutral-500">{task.key}</span>
        <span className="rounded-full px-2 py-px text-[11px] font-medium" style={{ background: p.bg, color: p.fg }}>
          {task.priority}
        </span>
        <div className="flex-1" />
        <span className="font-num text-[11px] text-neutral-400">{task.estimate}</span>
        <Avatar initials={task.who} size={22} tone="brand" className="text-[9px]" />
      </div>
    </div>
  );
}

/** Kanban board with native drag-and-drop between and within columns. */
export function TaskBoard({ onAdd }: { onAdd: (column: TaskColumn) => void }) {
  const tasks = useTasks((s) => s.tasks);
  const move = useTasks((s) => s.move);
  const dragKey = useRef<string | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [target, setTarget] = useState<DropTarget>(null);

  const reset = () => {
    dragKey.current = null;
    setDragging(null);
    setTarget(null);
  };
  const drop = (column: TaskColumn, before: string | null) => {
    if (dragKey.current) move(dragKey.current, column, before);
    reset();
  };

  return (
    <div className="grid grid-cols-[repeat(4,minmax(240px,1fr))] items-start gap-3">
      {TASK_COLUMNS.map((c) => {
        const items = tasks.filter((t) => t.column === c.key);
        const over = !!dragging && target?.column === c.key;
        return (
          <div
            key={c.key}
            onDragOver={(e) => {
              e.preventDefault();
              if (target?.column !== c.key || target.before) setTarget({ column: c.key, before: null });
            }}
            onDrop={(e) => {
              e.preventDefault();
              drop(c.key, null);
            }}
            className={cn(
              "flex min-h-[280px] flex-col gap-2.5 rounded-2xl p-3 transition-colors",
              over ? "bg-brand-50 shadow-[inset_0_0_0_1px_#155dfc]" : "bg-neutral-50",
            )}
          >
            <div className="flex items-center gap-2 px-1">
              <span className="size-[7px] rounded-full" style={{ background: c.accent }} />
              <span className="text-[13px] font-semibold">{c.label}</span>
              <span className="text-[11px] text-neutral-400">{items.length}</span>
            </div>
            {!items.length && (
              <div className="rounded-xl border border-dashed border-neutral-200 p-[18px] text-center text-xs text-neutral-400">Перетащите задачу сюда</div>
            )}
            {items.map((t) => (
              <div key={t.key} className="contents">
                {over && target?.before === t.key && dragging !== t.key && <Slot />}
                <TaskCard
                  task={t}
                  dragging={dragging === t.key}
                  onDragStart={(e) => {
                    e.dataTransfer.effectAllowed = "move";
                    e.dataTransfer.setData("text/plain", t.key);
                    dragKey.current = t.key;
                    setTimeout(() => setDragging(t.key), 0);
                  }}
                  onDragEnd={reset}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (target?.column !== c.key || target.before !== t.key) setTarget({ column: c.key, before: t.key });
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    drop(c.key, t.key);
                  }}
                />
              </div>
            ))}
            {over && !target?.before && <Slot />}
            <button
              onClick={() => onAdd(c.key)}
              className="flex h-8 items-center justify-center gap-1.5 rounded-[10px] border border-dashed border-neutral-200 bg-transparent text-xs text-neutral-400 hover:bg-neutral-100"
            >
              <Icon name="plus" size={15} />
              Добавить
            </button>
          </div>
        );
      })}
    </div>
  );
}
