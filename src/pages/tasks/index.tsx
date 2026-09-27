import { useState } from "react";
import { TASK_COLUMNS, priorityStyle, typeGlyph, useTasks, type TaskColumn } from "@/entities/task";
import { CreateTaskModal } from "@/features/create-task";
import { Avatar, Button, Cell, FilterChip, Icon, Num, PageHeader, Row, SearchInput, Segmented, Table } from "@/shared/ui";
import { TaskBoard } from "@/widgets/task-board";

export function TasksPage() {
  const tasks = useTasks((s) => s.tasks);
  const [view, setView] = useState<"board" | "list">("board");
  const [newIn, setNewIn] = useState<TaskColumn | null>(null);
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const listed = tasks.filter((t) => !q || `${t.key} ${t.title}`.toLowerCase().includes(q));

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Доска задач"
        subtitle="внутренние задачи команды · спринт 14"
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
            <Button variant="primary" icon="plus" onClick={() => setNewIn("backlog")}>
              Новая задача
            </Button>
          </>
        }
      />
      <div className="flex items-center gap-2">
        <SearchInput width={220} placeholder="Ключ или заголовок" value={query} onChange={setQuery} />
        {["Исполнитель", "Тип", "Приоритет", "Метка", "Спринт"].map((f) => (
          <FilterChip key={f} label={f} />
        ))}
      </div>

      {view === "board" ? (
        <TaskBoard onAdd={setNewIn} />
      ) : (
        <Table cols="100px 90px minmax(260px,1fr) 130px 130px 90px 70px" minWidth={900} head={["Ключ", "Тип", "Задача", "Приоритет", "Статус", "Исполнитель", "Оценка"]}>
          {listed.map((t) => {
            const g = typeGlyph(t.type);
            const p = priorityStyle(t.priority);
            return (
              <Row key={t.key} hover>
                <Num className="text-neutral-500">{t.key}</Num>
                <span className="flex items-center gap-1.5 text-xs text-neutral-700">
                  <Icon name={g.icon} size={15} style={{ color: g.color }} />
                  {t.type}
                </span>
                <Cell>{t.title}</Cell>
                <span>
                  <span className="rounded-full px-2.5 py-0.5 text-xs font-medium" style={{ background: p.bg, color: p.fg }}>
                    {t.priority}
                  </span>
                </span>
                <span className="text-xs text-neutral-500">{TASK_COLUMNS.find((c) => c.key === t.column)?.label}</span>
                <span>
                  <Avatar initials={t.who} size={24} tone="brand" className="text-[9px]" />
                </span>
                <Num className="text-neutral-500">{t.estimate}</Num>
              </Row>
            );
          })}
        </Table>
      )}
      <CreateTaskModal column={newIn} onClose={() => setNewIn(null)} />
    </div>
  );
}
