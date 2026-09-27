import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { api, apiList, QK } from "@/shared/api";
import type { Board, Task, TaskComment, Operator, TaskInput, ColumnInput } from "./model";

export const taskKeys = {
  boards: [QK.boards] as const,
  tasks: (boardId: number) => [QK.tasks, boardId] as const,
  comments: (taskId: number) => [QK.taskComments, taskId] as const,
  operators: [QK.operators] as const,
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
