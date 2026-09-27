import { useState } from "react";
import { useSession } from "@/entities/session";
import { TASK_PRIORITIES, TASK_TYPES, priorityStyle, typeGlyph, useBoard, useOperators, useTasks, type Task, type TaskPriority, type TaskType } from "@/entities/task";
import { ManageColumnsModal } from "@/features/manage-columns";
import { TaskEditorModal, type TaskEditorTarget } from "@/features/task-editor";
import { formatDate, initialsOf } from "@/shared/lib";
import { Avatar, Button, Cell, EmptyState, FilterChip, Icon, Num, PageHeader, Row, SearchInput, Segmented, Table } from "@/shared/ui";
import { TaskBoard } from "@/widgets/task-board";

/** «me» | «none» | operator id | null (everyone). */
type AssigneeFilter = "me" | "none" | number | null;

const cycle = <T,>(list: T[], v: T | null): T | null => (v === null ? list[0] : (list[list.indexOf(v) + 1] ?? null));

export function TasksPage() {
  const me = useSession((s) => s.user);
  const board = useBoard();
  const tasks = useTasks(board.id);
  const operators = useOperators();
  const [view, setView] = useState<"board" | "list">("board");
  const [editor, setEditor] = useState<TaskEditorTarget>(null);
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [assignee, setAssignee] = useState<AssigneeFilter>(null);
  const [type, setType] = useState<TaskType | null>(null);
  const [priority, setPriority] = useState<TaskPriority | null>(null);
  const [tag, setTag] = useState<string | null>(null);
  const [hideDone, setHideDone] = useState(false);

  const tags = [...new Set(tasks.flatMap((t) => t.tags))].sort();
  const q = query.trim().toLowerCase();
  const visible = tasks.filter(
    (t) =>
      (!q || `${t.key} ${t.title} ${t.description}`.toLowerCase().includes(q)) &&
      (assignee === null ||
        (assignee === "me" ? t.assignee?.id === me?.id : assignee === "none" ? !t.assignee : t.assignee?.id === assignee)) &&
      (!type || t.type === type) &&
      (!priority || t.priority === priority) &&
      (!tag || t.tags.includes(tag)) &&
      (!hideDone || !t.column.isDone),
  );
  const open = tasks.filter((t) => !t.column.isDone).length;
  const assigneeLabel =
    assignee === null
      ? "Исполнитель"
      : assignee === "me"
        ? "Мои задачи"
        : assignee === "none"
          ? "Без исполнителя"
          : (operators.data?.find((o) => o.id === assignee)?.fullName ?? "Исполнитель");
  const assigneeCycle: AssigneeFilter[] = ["me", "none", ...(operators.data ?? []).filter((o) => o.id !== me?.id).map((o) => o.id)];
  const firstColumn = board.columns[0]?.id;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Доска задач"
        subtitle={`${board.name} · открытых ${open} из ${tasks.length}`}
        actions={
          <>
            <Segmented
              value={view}
              onChange={setView}
              options={[
                { value: "board", label: "Доска" },
                { value: "list", label: "Список" },
              ]}
            />
            <Button icon="settings-2" onClick={() => setColumnsOpen(true)}>
              Колонки
            </Button>
            <Button variant="primary" icon="plus" disabled={!firstColumn} onClick={() => firstColumn && setEditor({ columnId: firstColumn })}>
              Новая задача
            </Button>
          </>
        }
      />
      <div className="flex flex-wrap items-center gap-2">
        <SearchInput width={220} placeholder="Ключ, заголовок, описание" value={query} onChange={setQuery} />
        <FilterChip label={assigneeLabel} tone={assignee !== null ? "active" : "default"} onClick={() => setAssignee((a) => cycle(assigneeCycle, a))} />
        <FilterChip
          label={type ? typeGlyph(type).label : "Тип"}
          tone={type ? "active" : "default"}
          onClick={() => setType((t) => cycle(TASK_TYPES.map((x) => x.value), t))}
        />
        <FilterChip
          label={priority ? (TASK_PRIORITIES.find((p) => p.value === priority)?.label ?? "Приоритет") : "Приоритет"}
          tone={priority ? "active" : "default"}
          onClick={() => setPriority((p) => cycle(TASK_PRIORITIES.map((x) => x.value), p))}
        />
        {tags.length > 0 && <FilterChip label={tag ? `Метка: ${tag}` : "Метка"} tone={tag ? "active" : "default"} onClick={() => setTag((t) => cycle(tags, t))} />}
        <FilterChip icon="check" tone={hideDone ? "active" : "default"} label="Скрыть выполненные" onClick={() => setHideDone((v) => !v)} />
      </div>

      {view === "board" ? (
        <TaskBoard board={board} tasks={visible} onAdd={(columnId) => setEditor({ columnId })} onOpen={(task) => setEditor({ task })} />
      ) : visible.length ? (
        <TaskList tasks={visible} onOpen={(task) => setEditor({ task })} />
      ) : (
        <div className="rounded-xl border border-neutral-200">
          <EmptyState icon="layout-kanban" title={tasks.length ? "По фильтрам ничего не найдено" : "Задач пока нет"} />
        </div>
      )}
      <p className="m-0 text-xs text-neutral-400">
        Доска видна только команде Bilimtrack. Карточки перетаскиваются между колонками, клик открывает задачу с комментариями.
      </p>
      <TaskEditorModal board={board} target={editor} onClose={() => setEditor(null)} />
      {columnsOpen && <ManageColumnsModal board={board} onClose={() => setColumnsOpen(false)} />}
    </div>
  );
}

function TaskList({ tasks, onOpen }: { tasks: Task[]; onOpen: (t: Task) => void }) {
  return (
    <Table cols="96px 100px minmax(260px,1fr) 124px 124px 170px 96px 60px" minWidth={1080} head={["Ключ", "Тип", "Задача", "Приоритет", "Колонка", "Исполнитель", "Срок", "Оценка"]}>
      {tasks.map((t) => {
        const g = typeGlyph(t.type);
        const p = priorityStyle(t.priority);
        return (
          <Row key={t.id} onClick={() => onOpen(t)}>
            <Num className="text-neutral-500">{t.key}</Num>
            <span className="flex items-center gap-1.5 text-xs text-neutral-700">
              <Icon name={g.icon} size={15} style={{ color: g.color }} />
              {t.typeLabel}
            </span>
            <Cell className={t.completedAt ? "text-neutral-500 line-through" : undefined}>{t.title}</Cell>
            <span>
              <span className="rounded-full px-2.5 py-0.5 text-xs font-medium" style={{ background: p.bg, color: p.fg }}>
                {t.priorityLabel}
              </span>
            </span>
            <span className="flex items-center gap-1.5 text-xs text-neutral-500">
              <span className="size-[7px] rounded-full" style={{ background: t.column.color }} />
              {t.column.name}
            </span>
            <span className="flex min-w-0 items-center gap-1.5 text-xs">
              {t.assignee ? (
                <>
                  <Avatar initials={initialsOf(t.assignee.fullName)} size={22} tone="brand" className="text-[9px]" />
                  <Cell>{t.assignee.fullName}</Cell>
                </>
              ) : (
                <span className="text-neutral-400">—</span>
              )}
            </span>
            <span className="text-xs text-neutral-500">{t.dueDate ? formatDate(t.dueDate) : "—"}</span>
            <Num className="text-neutral-500">{t.estimate ?? "—"}</Num>
          </Row>
        );
      })}
    </Table>
  );
}
