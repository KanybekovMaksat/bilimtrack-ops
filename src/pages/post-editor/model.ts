import type { Article, ArticleStatus } from "@/entities/article";

/** Editor form state; saved as the article's Russian fields. */
export type Draft = {
  title: string;
  excerpt: string;
  category: string;
  author: string;
  status: ArticleStatus;
  date: string;
  slug: string;
  cover: string;
  seoTitle: string;
  seoDesc: string;
  featured: boolean;
};

export const today = () => new Date().toISOString().slice(0, 10);

export const fromArticle = (a: Article | undefined): Draft => ({
  title: a?.titleRu ?? "",
  excerpt: a?.excerptRu ?? "",
  category: a?.category ?? "",
  author: a?.author ?? "",
  status: a?.status ?? "draft",
  date: a?.publishedAt?.slice(0, 10) ?? today(),
  slug: a?.slug ?? "",
  cover: a?.coverImageUrl ?? "",
  seoTitle: a?.seoTitleRu ?? "",
  seoDesc: a?.seoDescriptionRu ?? "",
  featured: a?.isFeatured ?? false,
});
