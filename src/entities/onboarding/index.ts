import { create } from "zustand";
import { useMockQuery } from "@/shared/api";

/** The 14-step playbook, grouped by stage; each step has an owner. */
export const PLAYBOOK: { stage: string; steps: { title: string; owner: string }[] }[] = [
  { stage: "Договор", steps: [{ title: "Договор подписан", owner: "Продажи" }, { title: "Таблица функциональности согласована", owner: "Продажи" }, { title: "Назначен ответственный менеджер", owner: "Продажи" }] },
  { stage: "Настройка", steps: [{ title: "Организация и филиалы созданы", owner: "Админ платформы" }, { title: "Модули включены по договору", owner: "Админ платформы" }, { title: "Загружена структура подразделений", owner: "Клиент" }] },
  { stage: "Данные", steps: [{ title: "Импорт сотрудников", owner: "Клиент" }, { title: "Импорт учащихся", owner: "Клиент" }, { title: "Импорт расписания", owner: "Клиент" }] },
  { stage: "Обучение", steps: [{ title: "Вебинар для администрации", owner: "Поддержка" }, { title: "Обучение преподавателей", owner: "Поддержка" }] },
  { stage: "Запуск", steps: [{ title: "Доступы выданы учащимся", owner: "Клиент" }, { title: "Неделя без критических тикетов", owner: "Поддержка" }, { title: "Акт о запуске подписан", owner: "Продажи" }] },
];

export const PLAYBOOK_STEPS = PLAYBOOK.flatMap((g) => g.steps.map((s) => ({ ...s, stage: g.stage })));

export type Onboarding = {
  name: string;
  slug: string;
  short: string;
  kind: string;
  manager: string;
  start: string;
  due: string;
  /** steps completed when the prototype opens */
  initialDone: number;
  late?: boolean;
};

const ONBOARDINGS: Onboarding[] = [
  { name: "Колледж «Сапат»", slug: "comtehno", short: "СП", kind: "Договор", manager: "Бекзат Н.", start: "1 авг", due: "20 сен", initialDone: 7, late: true },
  { name: "НИШ Алматы", slug: "nis-almaty", short: "НИ", kind: "Договор", manager: "Ернар К.", start: "18 авг", due: "1 окт", initialDone: 12 },
  { name: "Колледж «Алатау»", slug: "comtehno", short: "КА", kind: "Пилот до 30 окт", manager: "Бекзат Н.", start: "2 сен", due: "30 окт", initialDone: 6 },
  { name: "Гимназия №12", slug: "nis-almaty", short: "Г1", kind: "Договор", manager: "Мадина А.", start: "9 сен", due: "15 ноя", initialDone: 3 },
  { name: "Лицей №7", slug: "it-astana", short: "Л7", kind: "Пилот до 20 ноя", manager: "Бекзат Н.", start: "21 сен", due: "20 ноя", initialDone: 1 },
];

export const useOnboardings = () => useMockQuery(["onboardings"], () => ONBOARDINGS);

type ChecklistState = {
  /** onboarding index → done flags per playbook step */
  done: Record<number, boolean[]>;
  toggle: (index: number, step: number, initial: boolean[]) => void;
};

export const useChecklist = create<ChecklistState>()((set) => ({
  done: {},
  toggle: (index, step, initial) =>
    set((s) => {
      const next = (s.done[index] ?? initial).slice();
      next[step] = !next[step];
      return { done: { ...s.done, [index]: next } };
    }),
}));

export const initialChecklist = (o: Onboarding) => PLAYBOOK_STEPS.map((_, i) => i < o.initialDone);
