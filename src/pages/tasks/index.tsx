import { useState } from "react";
import { useSession } from "@/entities/session";
import { TASK_PRIORITIES, TASK_TYPES, operatorOptions, priorityOptions, priorityStyle, typeGlyph, typeOptions, useBoard, useOperators, useTasks, type Task, type TaskPriority, type TaskType } from "@/entities/task";
import { ManageColumnsModal } from "@/features/manage-columns";
import { TaskEditorModal, type TaskEditorTarget } from "@/features/task-editor";
import { formatDate, initialsOf, sortRows, useUrlFilters, useUrlSearch } from "@/shared/lib";
import { Button, Cell, EmptyState, FilterChip, FilterMultiSelect, FilterReset, FilterSelect, Icon, PageHeader, Row, SearchInput, Segmented, Table, UserAvatar } from "@/shared/ui";
import { TaskBoard } from "@/widgets/task-board";

export function TasksPage() {
  const me = useSession((s) => s.user);
  const board = useBoard();
  const tasks = useTasks(board.id);
  const operators = useOperators();
  const [editor, setEditor] = useState<TaskEditorTarget>(null);
  const [columnsOpen, setColumnsOpen] = useState(false);
  const f = useUrlFilters();
  const [query, setQuery] = useUrlSearch(f, 250);
  const view = f.oneOf("view", ["board", "list"] as const) ?? "board";
  /** «me» | «none» | operator id (as string) | undefined (everyone). */
  const assignee = f.get("assignee");
  const types = f.list<TaskType>("type", TASK_TYPES.map((t) => t.value));
  const priorities = f.list<TaskPriority>("priority", TASK_PRIORITIES.map((p) => p.value));
  const tag = f.get("tag");
  const hideDone = f.flag("hideDone");

  const tags = [...new Set(tasks.flatMap((t) => t.tags))].sort();
  const q = query.trim().toLowerCase();
  const visible = tasks.filter(
    (t) =>
      (!q || `${t.title} ${t.description}`.toLowerCase().includes(q)) &&
      (!assignee ||
        (assignee === "me" ? t.assignee?.id === me?.id : assignee === "none" ? !t.assignee : String(t.assignee?.id) === assignee)) &&
      (!types.length || types.includes(t.type)) &&
      (!priorities.length || priorities.includes(t.priority)) &&
      (!tag || t.tags.includes(tag)) &&
      (!hideDone || !t.column.isDone),
  );
  const open = tasks.filter((t) => !t.column.isDone).length;
  const mine = operators.data?.find((o) => o.id === me?.id);
  const assigneeOptions = [
    { value: "me", label: "Мои задачи", avatar: { src: mine?.avatar ?? me?.avatar, initials: me?.initials ?? "?" } },
    { value: "none", label: "Без исполнителя", icon: "user" as const },
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
              onChange={(v) => f.set({ view: v === "board" ? undefined : v })}
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
        <FilterSelect
          label="Исполнитель"
          allLabel="Все исполнители"
          searchPlaceholder="Имя или логин"
          menuWidth={280}
          value={assignee}
          onChange={(v) => f.set({ assignee: v })}
          options={assigneeOptions}
        />
        <FilterMultiSelect label="Тип" allLabel="Все типы" values={types} onChange={(v) => f.set({ type: v })} options={typeOptions()} />
        <FilterMultiSelect label="Приоритет" allLabel="Любой приоритет" values={priorities} onChange={(v) => f.set({ priority: v })} options={priorityOptions()} />
        {tags.length > 0 && (
          <FilterSelect
            label="Метка"
            allLabel="Все метки"
            value={tag}
            onChange={(v) => f.set({ tag: v })}
            options={tags.map((t) => ({ value: t, label: t, icon: "tag" }))}
          />
        )}
        <FilterChip icon="check" tone={hideDone ? "active" : "default"} label="Скрыть выполненные" onClick={() => f.set({ hideDone: !hideDone })} />
        <FilterReset filters={f} keys={["q", "assignee", "type", "priority", "tag", "hideDone"]} />
      </div>

      {view === "board" ? (
        <TaskBoard board={board} tasks={visible} avatars={avatars} onAdd={(columnId) => setEditor({ columnId })} onOpen={(task) => setEditor({ task })} />
      ) : visible.length ? (
        <TaskList tasks={visible} avatars={avatars} onOpen={(task) => setEditor({ task })} sort={f.get("sort")} onSort={(s) => f.set({ sort: s })} />
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

type TaskListProps = {
  tasks: Task[];
  onOpen: (t: Task) => void;
  avatars: Record<number, string | null | undefined>;
  sort?: string;
  onSort: (sort: string | undefined) => void;
};

function TaskList({ tasks, onOpen, avatars, sort, onSort }: TaskListProps) {
  const rows = sortRows(tasks, sort, {
    type: (t) => t.typeLabel,
    title: (t) => t.title,
    priority: (t) => TASK_PRIORITIES.findIndex((p) => p.value === t.priority),
    column: (t) => t.column.name,
    assignee: (t) => t.assignee?.fullName,
    due: (t) => t.dueDate,
  });
  return (
    <Table
      cols="110px minmax(260px,1fr) 124px 124px 170px 96px"
      minWidth={960}
      head={["Тип", "Задача", "Приоритет", "Колонка", "Исполнитель", "Срок"]}
      sortKeys={["type", "title", "priority", "column", "assignee", "due"]}
      sort={sort}
      onSort={onSort}
    >
      {rows.map((t) => {
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
