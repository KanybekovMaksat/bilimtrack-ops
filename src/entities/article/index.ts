import { useMockQuery } from "@/shared/api";
import type { PillTone } from "@/shared/ui";

export type ArticleStatus = "Опубликовано" | "Запланировано" | "Черновик";

export const articleTone: Record<ArticleStatus, PillTone> = {
  Опубликовано: "success",
  Запланировано: "info",
  Черновик: "neutral",
};

export type Article = {
  title: string;
  author: string;
  category: string;
  date: string;
  views: string;
  /** Demo requests attributed to the article — the link between content and sales. */
  leads: number;
  status: ArticleStatus;
};

const ARTICLES: Article[] = [
  { title: "Как колледжу перейти на электронный журнал", author: "Жанна М.", category: "Практика", date: "19 сен 2026", views: "4 812", leads: 6, status: "Опубликовано" },
  { title: "GPA в колледже: как считать и не запутаться", author: "Жанна М.", category: "Методика", date: "12 сен 2026", views: "3 104", leads: 4, status: "Опубликовано" },
  { title: "Интервью: цифровизация НИШ Алматы", author: "Тимур О.", category: "Кейсы", date: "24 сен 2026", views: "—", leads: 0, status: "Запланировано" },
  { title: "Электронный журнал для колледжа: с чего начать", author: "Жанна М.", category: "Практика", date: "—", views: "—", leads: 0, status: "Черновик" },
  { title: "Пять ошибок при переходе на электронное расписание", author: "Жанна М.", category: "Практика", date: "02 сен 2026", views: "2 240", leads: 2, status: "Опубликовано" },
  { title: "Как мы считаем рейтинг учащихся", author: "Ернар К.", category: "Продукт", date: "—", views: "—", leads: 0, status: "Черновик" },
];

export const useArticles = () => useMockQuery(["articles"], () => ARTICLES);

export const EDITOR_DRAFT = {
  title: "Электронный журнал для колледжа: с чего начать",
  lead: "Переход с бумажного журнала занимает не месяц и не полгода — при нормальной подготовке колледж на 2 000 студентов запускается за две недели. Разберём по шагам, что нужно сделать до первого занятия в системе.",
  sections: [
    {
      heading: "Шаг 1. Собрать структуру",
      body: "Филиалы, отделения, группы и дисциплины — это скелет, на который встанет всё остальное. Пока он не заполнен, расписание завести не получится.",
      illustration: "Иллюстрация: структура колледжа в системе",
    },
  ],
  props: [
    { k: "Слаг", v: "e-journal-college-start" },
    { k: "Категория", v: "Практика" },
    { k: "Теги", v: "электронный журнал, колледж" },
    { k: "Автор", v: "Жанна Мукашева" },
    { k: "Дата публикации", v: "24.09.2026 10:00" },
  ],
  seo: "Пошаговый разбор перехода колледжа на электронный журнал: структура, роли, расписание и первые оценки.",
};

export type DictKind = "cat" | "tag" | "author";

const DICTS: Record<DictKind, { name: string; slug: string; count: string }[]> = {
  cat: [
    { name: "Практика", slug: "praktika", count: "12 статей" },
    { name: "Методика", slug: "metodika", count: "7 статей" },
    { name: "Кейсы", slug: "keysy", count: "5 статей" },
    { name: "Продукт", slug: "produkt", count: "9 статей" },
  ],
  tag: [
    { name: "электронный журнал", slug: "e-journal", count: "14 статей" },
    { name: "GPA", slug: "gpa", count: "6 статей" },
    { name: "колледж", slug: "college", count: "11 статей" },
    { name: "расписание", slug: "schedule", count: "8 статей" },
  ],
  author: [
    { name: "Жанна Мукашева", slug: "zh-mukasheva", count: "21 статья" },
    { name: "Ернар Калиев", slug: "e-kaliyev", count: "6 статей" },
    { name: "Тимур Оспанов", slug: "t-ospanov", count: "3 статьи" },
  ],
};

export const DICT_TABS: { key: DictKind; label: string; count: number }[] = [
  { key: "cat", label: "Категории", count: 8 },
  { key: "tag", label: "Теги", count: 24 },
  { key: "author", label: "Авторы", count: 4 },
];

export const useDictionary = (kind: DictKind) => useMockQuery(["dicts", kind], () => DICTS[kind]);

const MEDIA = Array.from({ length: 12 }, (_, k) => ({
  id: k,
  name: ["obloshka-journal.png", "gpa-chart.png", "nis-almaty-1.jpg", "team-photo.jpg", "schedule-ui.png", "college-hero.jpg"][k % 6],
  size: ["340 КБ", "1,2 МБ", "820 КБ", "2,1 МБ", "460 КБ", "1,8 МБ"][k % 6],
}));

export const useMedia = () => useMockQuery(["media"], () => MEDIA);
