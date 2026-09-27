import { useState } from "react";
import { useSession } from "@/entities/session";
import { operatorOptions, priorityOptions, priorityStyle, typeGlyph, typeOptions, useBoard, useOperators, useTasks, type Task, type TaskPriority, type TaskType } from "@/entities/task";
import { ManageColumnsModal } from "@/features/manage-columns";
import { TaskEditorModal, type TaskEditorTarget } from "@/features/task-editor";
import { formatDate, initialsOf } from "@/shared/lib";
import { Button, Cell, Dropdown, EmptyState, FilterChip, Icon, PageHeader, Row, SearchInput, Segmented, Table, UserAvatar } from "@/shared/ui";
import { TaskBoard } from "@/widgets/task-board";

/** «me» | «none» | operator id (as string) | null (everyone). */
type AssigneeFilter = string | null;

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
      (!q || `${t.title} ${t.description}`.toLowerCase().includes(q)) &&
      (assignee === null ||
        (assignee === "me" ? t.assignee?.id === me?.id : assignee === "none" ? !t.assignee : String(t.assignee?.id) === assignee)) &&
      (!type || t.type === type) &&
      (!priority || t.priority === priority) &&
      (!tag || t.tags.includes(tag)) &&
      (!hideDone || !t.column.isDone),
  );
  const open = tasks.filter((t) => !t.column.isDone).length;
  const mine = operators.data?.find((o) => o.id === me?.id);
  const assigneeOptions = [
    { value: "me", label: "Мои задачи", avatar: { src: mine?.avatar ?? me?.avatar, initials: me?.initials ?? "?" } },
    { value: "none", label: "Без исполнителя", icon: "user" },
    ...operatorOptions((operators.data ?? []).filter((o) => o.id !== me?.id)),
  ];
  const avatars = Object.fromEntries((operators.data ?? []).map((o) => [o.id, o.avatar]));
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
        <SearchInput width={220} placeholder="Заголовок или описание" value={query} onChange={setQuery} />
        <Dropdown<string>
          look="chip"
          label="Исполнитель"
          placeholder="Все исполнители"
          clearable
          searchable
          searchPlaceholder="Имя или логин"
          menuWidth={280}
          value={assignee}
          onChange={setAssignee}
          options={assigneeOptions}
        />
        <Dropdown<TaskType> look="chip" label="Тип" placeholder="Все типы" clearable value={type} onChange={setType} options={typeOptions()} />
        <Dropdown<TaskPriority> look="chip" label="Приоритет" placeholder="Любой приоритет" clearable value={priority} onChange={setPriority} options={priorityOptions()} />
        {tags.length > 0 && (
          <Dropdown<string>
            look="chip"
            label="Метка"
            placeholder="Все метки"
            clearable
            searchable={tags.length > 8}
            value={tag}
            onChange={setTag}
            options={tags.map((t) => ({ value: t, label: t, icon: "tag" }))}
          />
        )}
        <FilterChip icon="check" tone={hideDone ? "active" : "default"} label="Скрыть выполненные" onClick={() => setHideDone((v) => !v)} />
      </div>

      {view === "board" ? (
        <TaskBoard board={board} tasks={visible} avatars={avatars} onAdd={(columnId) => setEditor({ columnId })} onOpen={(task) => setEditor({ task })} />
      ) : visible.length ? (
        <TaskList tasks={visible} avatars={avatars} onOpen={(task) => setEditor({ task })} />
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

function TaskList({ tasks, onOpen, avatars }: { tasks: Task[]; onOpen: (t: Task) => void; avatars: Record<number, string | null | undefined> }) {
  return (
    <Table cols="110px minmax(260px,1fr) 124px 124px 170px 96px" minWidth={960} head={["Тип", "Задача", "Приоритет", "Колонка", "Исполнитель", "Срок"]}>
      {tasks.map((t) => {
        const g = typeGlyph(t.type);
        const p = priorityStyle(t.priority);
        return (
          <Row key={t.id} onClick={() => onOpen(t)}>
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
                  <UserAvatar src={avatars[t.assignee.id]} initials={initialsOf(t.assignee.fullName)} size={22} className="text-[9px]" />
                  <Cell>{t.assignee.fullName}</Cell>
                </>
              ) : (
                <span className="text-neutral-400">—</span>
              )}
            </span>
            <span className="text-xs text-neutral-500">{t.dueDate ? formatDate(t.dueDate) : "—"}</span>
          </Row>
        );
      })}
    </Table>
  );
}
