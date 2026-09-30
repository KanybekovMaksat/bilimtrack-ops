export type Tab = "reports" | "posts" | "comments" | "chats";

export const STATUS_OPTIONS: Record<Tab, { value: string; label: string }[]> = {
  reports: [
    { value: "open", label: "Ожидают разбора" },
    { value: "resolved", label: "Меры приняты" },
    { value: "rejected", label: "Отклонены" },
  ],
  posts: [
    { value: "published", label: "Опубликованные" },
    { value: "hidden", label: "Скрытые" },
    { value: "archived", label: "Удалённые автором" },
    { value: "draft", label: "Черновики" },
  ],
  comments: [
    { value: "published", label: "Опубликованные" },
    { value: "hidden", label: "Скрытые" },
    { value: "archived", label: "Удалённые автором" },
  ],
  chats: [],
};

export const PLACEHOLDER: Record<Tab, string> = {
  reports: "Пояснение к жалобе",
  posts: "Текст и заголовок поста",
  comments: "Текст комментария",
  chats: "Название чата или участник",
};

export const QUICK_REASONS = ["Оскорбления", "Нецензурная лексика", "Спам или реклама", "Личные данные", "Травля"];

