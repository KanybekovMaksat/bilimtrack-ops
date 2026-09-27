import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { api, apiList } from "@/shared/api";
import { initialsOf } from "@/shared/lib";
import type { DropdownOption } from "@/shared/ui";

/* Team task board. Backend: server/apps/ops (Task, TaskBoard, use_cases/tasks.py),
   /api/v1/ops/boards/ and /api/v1/ops/tasks/. Only Bilimtrack operators see the OPS board. */

export type TaskType = "task" | "bug" | "feature" | "story";
export type TaskPriority = "low" | "normal" | "medium" | "high" | "urgent";

export const TASK_TYPES: { value: TaskType; label: string; icon: string; color: string }[] = [
  { value: "task", label: "Задача", icon: "checkbox", color: "#737373" },
  { value: "bug", label: "Баг", icon: "bug", color: "#fb2c36" },
  { value: "feature", label: "Фича", icon: "sparkles", color: "#155dfc" },
  { value: "story", label: "Story", icon: "book", color: "#8e51ff" },
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
  bg: p === "urgent" ? "#fb2c36" : p === "high" ? "#fff7ed" : "transparent",
  fg: p === "urgent" ? "#fff" : p === "high" ? "#c2410c" : p === "low" ? "#a1a1a1" : "#737373",
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

const PRIORITY_DOT: Record<TaskPriority, string> = { low: "#d4d4d4", normal: "#a1a1a1", medium: "#fd9a00", high: "#f97316", urgent: "#fb2c36" };

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

export const taskKeys = {
  boards: ["ops-boards"] as const,
  tasks: (boardId: number) => ["ops-tasks", boardId] as const,
  comments: (taskId: number) => ["ops-task-comments", taskId] as const,
  operators: ["ops-operators"] as const,
};

/** The team board (OPS) with its columns. */
export const useBoard = () =>
  useSuspenseQuery({
    queryKey: taskKeys.boards,
    queryFn: async () => {
      const boards = await api<Board[]>("ops/boards/");
      if (!boards.length) throw new Error("Доска задач не найдена");
      return boards.find((b) => b.key === "OPS") ?? boards[0];
    },
  }).data;

/** Every task of the board, ordered by column and position (a team board holds hundreds, not thousands). */
export const useTasks = (boardId: number) =>
  useSuspenseQuery({
    queryKey: taskKeys.tasks(boardId),
    queryFn: () => apiList<Task>("ops/tasks/", { boardId }),
    refetchInterval: 30_000,
  }).data;

export const useOperators = () =>
  useQuery({ queryKey: taskKeys.operators, queryFn: () => api<Operator[]>("ops/operators/"), staleTime: 5 * 60_000 });

function useInvalidateBoard(boardId: number) {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: taskKeys.tasks(boardId) });
    qc.invalidateQueries({ queryKey: taskKeys.boards });
  };
}

export function useCreateTask(boardId: number) {
  const invalidate = useInvalidateBoard(boardId);
  return useMutation({
    mutationFn: (input: TaskInput & { title: string }) => api<Task>("ops/tasks/", { method: "POST", body: { ...input, boardId } }),
    onSuccess: invalidate,
  });
}

export function useUpdateTask(boardId: number) {
  const qc = useQueryClient();
  const invalidate = useInvalidateBoard(boardId);
  return useMutation({
    mutationFn: ({ id, ...input }: TaskInput & { id: number }) => api<Task>(`ops/tasks/${id}/`, { method: "PATCH", body: input }),
    onSuccess: (task) => {
      qc.setQueryData<Task[]>(taskKeys.tasks(boardId), (list) => list?.map((t) => (t.id === task.id ? task : t)));
      invalidate();
    },
  });
}

export function useDeleteTask(boardId: number) {
  const invalidate = useInvalidateBoard(boardId);
  return useMutation({ mutationFn: (id: number) => api(`ops/tasks/${id}/`, { method: "DELETE" }), onSuccess: invalidate });
}

/** Local copy of the server's move: the task lands in `columnId` before `beforeId` (or at the end). */
function moveLocally(list: Task[], id: number, column: Task["column"], beforeId: number | null): Task[] {
  const task = list.find((t) => t.id === id);
  if (!task || id === beforeId) return list;
  const rest = list.filter((t) => t.id !== id);
  let idx = beforeId ? rest.findIndex((t) => t.id === beforeId) : -1;
  if (idx < 0) {
    const last = rest.map((t) => t.column.id).lastIndexOf(column.id);
    idx = last >= 0 ? last + 1 : rest.length;
  }
  rest.splice(idx, 0, { ...task, column });
  return rest;
}

/** Drag and drop: optimistic reorder, then POST ops/tasks/:id/move/. */
export function useMoveTask(board: Board) {
  const qc = useQueryClient();
  const key = taskKeys.tasks(board.id);
  return useMutation({
    mutationFn: ({ id, columnId, beforeId }: { id: number; columnId: number; beforeId: number | null }) =>
      api<Task>(`ops/tasks/${id}/move/`, { method: "POST", body: { columnId, beforeTaskId: beforeId } }),
    onMutate: async ({ id, columnId, beforeId }) => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<Task[]>(key);
      const col = board.columns.find((c) => c.id === columnId);
      if (col) {
        qc.setQueryData<Task[]>(key, (list) =>
          list ? moveLocally(list, id, { id: col.id, name: col.name, color: col.color, isDone: col.isDone }, beforeId) : list,
        );
      }
      return { prev };
    },
    onError: (_e, _v, ctx) => ctx?.prev && qc.setQueryData(key, ctx.prev),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: key });
      qc.invalidateQueries({ queryKey: taskKeys.boards });
    },
  });
}

export const useTaskComments = (taskId: number) =>
  useQuery({ queryKey: taskKeys.comments(taskId), queryFn: () => api<TaskComment[]>(`ops/tasks/${taskId}/comments/`) });

export function useAddComment(boardId: number, taskId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (text: string) => api<TaskComment>(`ops/tasks/${taskId}/comments/`, { method: "POST", body: { text } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: taskKeys.comments(taskId) });
      qc.invalidateQueries({ queryKey: taskKeys.tasks(boardId) });
    },
  });
}

export function useDeleteComment(boardId: number, taskId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (commentId: number) => api(`ops/tasks/${taskId}/comments/${commentId}/`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: taskKeys.comments(taskId) });
      qc.invalidateQueries({ queryKey: taskKeys.tasks(boardId) });
    },
  });
}

export type ColumnInput = { name?: string; color?: string; isDone?: boolean; position?: number };

export function useSaveColumn(boardId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: ColumnInput & { id?: number }) =>
      id
        ? api<Board>(`ops/boards/${boardId}/columns/${id}/`, { method: "PATCH", body: input })
        : api<Board>(`ops/boards/${boardId}/columns/`, { method: "POST", body: input }),
    onSuccess: (board) => {
      qc.setQueryData(taskKeys.boards, board);
      qc.invalidateQueries({ queryKey: taskKeys.tasks(boardId) });
    },
  });
}

export function useDeleteColumn(boardId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api(`ops/boards/${boardId}/columns/${id}/`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: taskKeys.boards }),
  });
}
