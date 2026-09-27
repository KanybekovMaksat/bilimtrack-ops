import { delay, nextId, notFound } from "@/shared/api";
import type { CreateTicketInput, Ticket, TicketFilters, UpdateTicketInput } from "../model/types";

const hoursAgo = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString();

type Seed = Omit<Ticket, "createdAt" | "updatedAt"> & { age: number };

const seed: Seed[] = [
  { id: "T-1042", title: "Не загружается расписание на мобильном", description: "Студенты сообщают, что вкладка «Расписание» в PWA показывает пустой экран после обновления.", organizationId: "org-1", priority: "critical", status: "in_progress", assigneeId: "emp-3", age: 2 },
  { id: "T-1041", title: "Импорт студентов из Excel падает на 500", description: "Файл на 2300 строк, ошибка на этапе валидации групп.", organizationId: "org-2", priority: "high", status: "open", assigneeId: null, age: 5 },
  { id: "T-1040", title: "Родители не получают push-уведомления", description: "После смены домена на bilimtrack.kg уведомления перестали приходить на iOS.", organizationId: "org-3", priority: "high", status: "in_progress", assigneeId: "emp-5", age: 9 },
  { id: "T-1039", title: "Добавить роль «Куратор группы»", description: "Запрос на новую роль с доступом к журналу только своей группы.", organizationId: "org-4", priority: "medium", status: "open", assigneeId: "emp-1", age: 20 },
  { id: "T-1038", title: "Неверный расчёт среднего балла", description: "В ведомости средний балл учитывает пропуски как 0.", organizationId: "org-1", priority: "high", status: "resolved", assigneeId: "emp-3", age: 30 },
  { id: "T-1037", title: "Настроить SSO через Google Workspace", description: "Онбординг нового клиента, нужен вход сотрудников через корпоративный Google.", organizationId: "org-7", priority: "medium", status: "open", assigneeId: "emp-2", age: 36 },
  { id: "T-1036", title: "Опечатка в шаблоне справки", description: "В справке об обучении «обучающимся» написано с ошибкой.", organizationId: "org-6", priority: "low", status: "closed", assigneeId: "emp-4", age: 52 },
  { id: "T-1035", title: "Медленная загрузка аналитики директора", description: "Дашборд аналитики грузится более 15 секунд.", organizationId: "org-2", priority: "medium", status: "in_progress", assigneeId: "emp-3", age: 60 },
  { id: "T-1034", title: "Выгрузка посещаемости в PDF", description: "Нужна выгрузка посещаемости за семестр в PDF для министерства.", organizationId: "org-5", priority: "low", status: "open", assigneeId: null, age: 75 },
  { id: "T-1033", title: "Сброс пароля не приходит на почту", description: "Письма уходят в спам у пользователей mail.ru.", organizationId: "org-3", priority: "medium", status: "resolved", assigneeId: "emp-5", age: 96 },
];

let tickets: Ticket[] = seed.map(({ age, ...t }) => ({ ...t, createdAt: hoursAgo(age), updatedAt: hoursAgo(age / 2) }));

function matches(ticket: Ticket, f: TicketFilters) {
  if (f.status && ticket.status !== f.status) return false;
  if (f.priority && ticket.priority !== f.priority) return false;
  if (f.organizationId && ticket.organizationId !== f.organizationId) return false;
  if (f.search) {
    const q = f.search.toLowerCase();
    if (!ticket.title.toLowerCase().includes(q) && !ticket.id.toLowerCase().includes(q)) return false;
  }
  return true;
}

export const ticketApi = {
  list: (filters: TicketFilters = {}) =>
    delay(
      tickets
        .filter((t) => matches(t, filters))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    ),

  get: (id: string) => {
    const ticket = tickets.find((t) => t.id === id);
    return ticket ? delay(ticket) : notFound("Тикет", id);
  },

  create: (input: CreateTicketInput) => {
    const now = new Date().toISOString();
    const ticket: Ticket = {
      ...input,
      id: nextId("T").toUpperCase(),
      status: "open",
      assigneeId: null,
      createdAt: now,
      updatedAt: now,
    };
    tickets = [ticket, ...tickets];
    return delay(ticket);
  },

  update: (id: string, patch: UpdateTicketInput) => {
    const current = tickets.find((t) => t.id === id);
    if (!current) return notFound("Тикет", id);
    const updated = { ...current, ...patch, updatedAt: new Date().toISOString() };
    tickets = tickets.map((t) => (t.id === id ? updated : t));
    return delay(updated);
  },
};
