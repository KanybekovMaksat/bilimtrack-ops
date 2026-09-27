import { useMockQuery } from "@/shared/api";

export type IdeaStatus = "" | "Взято в работу" | "Отклонено";

export type Idea = {
  id: number;
  author: string;
  initials: string;
  role: string;
  org: string;
  orgShort: string;
  time: string;
  text: string;
  screenshots: number;
  status: IdeaStatus;
};

const IDEAS: Idea[] = [
  { id: 1, author: "Алишер Темиров", initials: "АТ", role: "Учащийся", org: "МУИТ", orgShort: "МУ", time: "вчера, 17:20", text: "Показывайте GPA прямо в шапке профиля, а не через три экрана. Сейчас чтобы посмотреть свой средний балл, надо зайти в дневник, выбрать семестр и пролистать вниз. Хотелось бы видеть его сразу.", screenshots: 2, status: "" },
  { id: 2, author: "Динара Жумабекова", initials: "ДЖ", role: "Преподаватель", org: "Comtehno", orgShort: "CT", time: "19 сен, 11:04", text: "В журнале не хватает кнопки «скопировать оценки с прошлого занятия» — на практиках у многих групп оценки повторяются, и каждый раз выставлять по одной долго.", screenshots: 1, status: "Взято в работу" },
  { id: 3, author: "Гульнара Оспанова", initials: "ГО", role: "Завуч", org: "НИШ Алматы", orgShort: "НИ", time: "17 сен, 09:32", text: "Родителям приходит уведомление об оценке, но не видно, за что именно. Добавьте тему урока в текст уведомления.", screenshots: 0, status: "" },
  { id: 4, author: "Ербол Сагындыков", initials: "ЕС", role: "Преподаватель", org: "Comtehno", orgShort: "CT", time: "15 сен, 14:50", text: "Сделайте тёмную тему в мобильном приложении. Студенты постоянно спрашивают.", screenshots: 3, status: "Отклонено" },
];

export const useIdeas = () => useMockQuery(["ideas"], () => IDEAS);
