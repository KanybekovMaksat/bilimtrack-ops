import { create } from "zustand";

export type TaskColumn = "backlog" | "work" | "review" | "done";
export type TaskType = "Задача" | "Баг" | "Фича";
export type TaskPriority = "Низкий" | "Обычный" | "Средний" | "Высокий" | "Критический";

export type Task = {
  key: string;
  title: string;
  type: TaskType;
  priority: TaskPriority;
  /** assignee initials */
  who: string;
  estimate: string;
  tags: string[];
  column: TaskColumn;
};

export const TASK_COLUMNS: { key: TaskColumn; label: string; accent: string }[] = [
  { key: "backlog", label: "Бэклог", accent: "#a1a1a1" },
  { key: "work", label: "В работе", accent: "#155dfc" },
  { key: "review", label: "На ревью", accent: "#fd9a00" },
  { key: "done", label: "Готово", accent: "#00c951" },
];

export const TASK_TYPES: { type: TaskType; icon: string; color: string }[] = [
  { type: "Задача", icon: "checkbox", color: "#737373" },
  { type: "Баг", icon: "bug", color: "#fb2c36" },
  { type: "Фича", icon: "sparkles", color: "#155dfc" },
];

export const TASK_PRIORITIES: TaskPriority[] = ["Низкий", "Обычный", "Средний", "Высокий", "Критический"];
export const TASK_ESTIMATES = ["1", "2", "3", "5", "8"];
export const TASK_PEOPLE = [
  { initials: "АС", name: "Айдана С." },
  { initials: "ЕК", name: "Ернар К." },
  { initials: "ТО", name: "Тимур О." },
  { initials: "ЖМ", name: "Жанна М." },
];

export const typeGlyph = (type: TaskType) => TASK_TYPES.find((t) => t.type === type)!;

export const priorityStyle = (p: TaskPriority) => ({
  bg: p === "Критический" ? "#fb2c36" : p === "Высокий" ? "#fff7ed" : "transparent",
  fg: p === "Критический" ? "#fff" : p === "Высокий" ? "#c2410c" : p === "Низкий" ? "#a1a1a1" : "#737373",
});

const SEED: Task[] = [
  { key: "OPS-141", title: "Тикеты из Telegram без автора — связывать по номеру", type: "Фича", priority: "Высокий", who: "АС", estimate: "5", tags: ["поддержка"], column: "work" },
  { key: "OPS-138", title: "Выгрузка оценок падает по таймауту на группах 200+", type: "Баг", priority: "Критический", who: "ЕК", estimate: "3", tags: ["журнал", "срочно"], column: "work" },
  { key: "OPS-144", title: "Экран биллинга организаций: ручной ввод платежей", type: "Задача", priority: "Средний", who: "ТО", estimate: "8", tags: ["биллинг"], column: "review" },
  { key: "OPS-129", title: "Уведомления PRO не доходят при истёкшем токене WhatsApp", type: "Баг", priority: "Высокий", who: "АС", estimate: "2", tags: ["каналы"], column: "review" },
  { key: "OPS-150", title: "Пресеты модулей под тип заведения", type: "Фича", priority: "Средний", who: "ЕК", estimate: "5", tags: ["организации"], column: "backlog" },
  { key: "OPS-151", title: "Массовая рассылка по сегментам аккаунтов", type: "Фича", priority: "Средний", who: "ЖМ", estimate: "8", tags: ["аккаунты"], column: "backlog" },
  { key: "OPS-152", title: "Логи входов: фильтр «только неудачные»", type: "Задача", priority: "Низкий", who: "ТО", estimate: "1", tags: ["платформа"], column: "backlog" },
  { key: "OPS-118", title: "Привязка профиля к аккаунту с подтверждением", type: "Фича", priority: "Высокий", who: "АС", estimate: "5", tags: ["аккаунты"], column: "done" },
  { key: "OPS-122", title: "Колонка «заявки со статьи» в списке статей", type: "Задача", priority: "Обычный", who: "ЖМ", estimate: "2", tags: ["контент"], column: "done" },
];

type TaskState = {
  tasks: Task[];
  nextNumber: number;
  add: (t: Omit<Task, "key">) => void;
  /** Moves a task into a column, before another task or to the end. */
  move: (key: string, column: TaskColumn, beforeKey: string | null) => void;
};

/** The team board is client-side state for now (no backend model yet). */
export const useTasks = create<TaskState>()((set) => ({
  tasks: SEED,
  nextNumber: 153,
  add: (t) => set((s) => ({ tasks: [...s.tasks, { ...t, key: `OPS-${s.nextNumber}` }], nextNumber: s.nextNumber + 1 })),
  move: (key, column, beforeKey) =>
    set((s) => {
      const task = s.tasks.find((t) => t.key === key);
      if (!task || key === beforeKey) return s;
      const rest = s.tasks.filter((t) => t.key !== key);
      let idx = beforeKey ? rest.findIndex((t) => t.key === beforeKey) : -1;
      if (idx < 0) {
        const last = rest.map((t) => t.column).lastIndexOf(column);
        idx = last >= 0 ? last + 1 : rest.length;
      }
      rest.splice(idx, 0, { ...task, column });
      return { tasks: rest };
    }),
}));
