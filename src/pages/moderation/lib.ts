import { useSearchParams } from "react-router";

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

/** The whole page state lives in the URL, so a selection («все скрытые комментарии этого студента») can be shared. */
export function useFilters() {
  const [params, setParams] = useSearchParams();
  const get = (k: string) => params.get(k) ?? undefined;
  const set = (patch: Record<string, string | undefined>) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        for (const [k, v] of Object.entries(patch)) {
          if (v === undefined || v === "") next.delete(k);
          else next.set(k, v);
        }
        if (!("page" in patch)) next.delete("page");
        return next;
      },
      { replace: true },
    );
  return { get, set };
}

export const num = (v?: string) => (v && Number(v) > 0 ? Number(v) : undefined);
