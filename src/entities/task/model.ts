import { initialsOf } from "@/shared/lib";
import type { DropdownOption, IconName } from "@/shared/ui";

/* Team task board. Backend: server/apps/ops (Task, TaskBoard, use_cases/tasks.py),
   /api/v1/ops/boards/ and /api/v1/ops/tasks/. Only Bilimtrack operators see the OPS board. */

export type TaskType = "task" | "bug" | "feature" | "story";
export type TaskPriority = "low" | "normal" | "medium" | "high" | "urgent";

export const TASK_TYPES: { value: TaskType; label: string; icon: IconName; color: string }[] = [
  { value: "task", label: "Задача", icon: "checkbox", color: "var(--color-neutral-500)" },
  { value: "bug", label: "Баг", icon: "bug", color: "var(--color-red-500)" },
  { value: "feature", label: "Фича", icon: "sparkles", color: "var(--color-brand)" },
  { value: "story", label: "Story", icon: "book", color: "var(--color-violet-500)" },
];

export const TASK_PRIORITIES: { value: TaskPriority; label: string }[] = [
  { value: "low", label: "Низкий" },
  { value: "normal", label: "Обычный" },
  { value: "medium", label: "Средний" },
  { value: "high", label: "Высокий" },
  { value: "urgent", label: "Критический" },
];

export const typeGlyph = (type: TaskType) => TASK_TYPES.find((t) => t.value === type) ?? TASK_TYPES[0];
export const priorityLabel = (p: TaskPriority) => TASK_PRIORITIES.find((x) => x.value === p)?.label ?? p;

export const priorityStyle = (p: TaskPriority) => ({
  bg: p === "urgent" ? "var(--color-red-500)" : p === "high" ? "var(--color-orange-50)" : "transparent",
  fg: p === "urgent" ? "var(--color-white)" : p === "high" ? "var(--color-warn)" : p === "low" ? "var(--color-neutral-400)" : "var(--color-neutral-500)",
});

export type Person = { id: number; username: string; fullName: string };

export type BoardColumn = { id: number; name: string; color: string; position: number; isDone: boolean; tasksCount: number };
export type Board = { id: number; key: string; name: string; description: string; columns: BoardColumn[] };

/** TaskSerializer. */
export type Task = {
  id: number;
  key: string;
  number: number;
  boardId: number;
  column: { id: number; name: string; color: string; isDone: boolean };
  position: number;
  title: string;
  description: string;
  type: TaskType;
  typeLabel: string;
  priority: TaskPriority;
  priorityLabel: string;
  assignee: Person | null;
  reporter: Person | null;
  estimate: number | null;
  tags: string[];
  dueDate: string | null;
  completedAt: string | null;
  commentsCount: number;
  createdAt: string;
  updatedAt: string;
};

export type TaskComment = { id: number; taskId: number; author: Person | null; text: string; createdAt: string; updatedAt: string };

export type Operator = {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: string;
  roleLabel: string;
  lastLogin: string | null;
  /** Profile photo the admin set in «Мой профиль». */
  avatar?: string | null;
};

/** Operators as select options: photo (or initials), name and login. */
export const operatorOptions = (operators: Operator[]): DropdownOption<string>[] =>
  operators.map((o) => ({
    value: String(o.id),
    label: o.fullName || o.username,
    hint: o.username,
    avatar: { src: o.avatar, initials: initialsOf(o.fullName || o.username) },
  }));

export const typeOptions = (): DropdownOption<TaskType>[] => TASK_TYPES.map((t) => ({ value: t.value, label: t.label, icon: t.icon, iconColor: t.color }));

const PRIORITY_DOT: Record<TaskPriority, string> = { low: "var(--color-neutral-300)", normal: "var(--color-neutral-400)", medium: "var(--color-amber-500)", high: "var(--color-orange-500)", urgent: "var(--color-red-500)" };

export const priorityOptions = (): DropdownOption<TaskPriority>[] => TASK_PRIORITIES.map((p) => ({ value: p.value, label: p.label, dot: PRIORITY_DOT[p.value] }));

export type TaskInput = {
  columnId?: number;
  title?: string;
  description?: string;
  type?: TaskType;
  priority?: TaskPriority;
  assigneeId?: number | null;
  tags?: string[];
  dueDate?: string | null;
};

export type ColumnInput = { name?: string; color?: string; isDone?: boolean; position?: number };
