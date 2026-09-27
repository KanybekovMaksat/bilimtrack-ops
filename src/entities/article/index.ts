import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { api, apiList, apiUpload, QK } from "@/shared/api";
import type { PillTone } from "@/shared/ui";

/* Blog content (admin side only). Backend: server/apps/blog, CMS API /api/v1/cms/*:
   articles, categories, authors, tags and cover uploads. The public blog renders `contentRu` as HTML. */

export type ArticleStatus = "draft" | "published" | "archived";

export const ARTICLE_STATUS: Record<ArticleStatus, { label: string; tone: PillTone }> = {
  draft: { label: "Черновик", tone: "neutral" },
  published: { label: "Опубликовано", tone: "success" },
  archived: { label: "В архиве", tone: "orange" },
};

/** CMSArticleListSerializer. */
export type ArticleRow = {
  id: string;
  titleRu: string;
  slug: string;
  excerptRu?: string;
  coverImageUrl?: string;
  status: ArticleStatus;
  isFeatured: boolean;
  publishedAt: string | null;
  createdAt: string;
  viewsCount: number;
  readingTime: number;
  category: string;
  categoryName: string;
  author: string;
  authorName: string;
};

/** CMSArticleSerializer. */
export type Article = {
  id: string;
  titleRu: string;
  titleKy: string;
  titleEn: string;
  slug: string;
  excerptRu: string;
  contentRu: string;
  coverImageUrl: string;
  readingTime: number;
  status: ArticleStatus;
  isFeatured: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  author: string;
  category: string;
  tags: string[];
  viewsCount: number;
  seoTitleRu: string;
  seoDescriptionRu: string;
};

export type ArticleInput = Partial<Omit<Article, "id" | "createdAt" | "updatedAt" | "viewsCount" | "readingTime">>;

export type BlogCategory = { id: string; nameRu: string; nameKy: string; nameEn: string; slug: string; descriptionRu: string; descriptionKy: string; descriptionEn: string; createdAt: string };
export type BlogAuthor = { id: string; name: string; bioRu: string; bioEn: string; avatarUrl: string; createdAt: string };
export type BlogTag = { id: string; nameRu: string; nameEn: string; slug: string };

export const blogKeys = {
  articles: [QK.cms, "articles"] as const,
  article: (id: string) => [QK.cms, "articles", id] as const,
  categories: [QK.cms, "categories"] as const,
  authors: [QK.cms, "authors"] as const,
  tags: [QK.cms, "tags"] as const,
};

export const useArticles = () => useSuspenseQuery({ queryKey: blogKeys.articles, queryFn: () => apiList<ArticleRow>("cms/articles/") }).data;
export const useArticlesSoft = () => useQuery({ queryKey: blogKeys.articles, queryFn: () => apiList<ArticleRow>("cms/articles/") });

export const useArticle = (id: string | null) =>
  useQuery({ queryKey: blogKeys.article(id ?? ""), queryFn: () => api<Article>(`cms/articles/${id}/`), enabled: !!id, staleTime: Infinity });

export const useCategories = () => useQuery({ queryKey: blogKeys.categories, queryFn: () => apiList<BlogCategory>("cms/categories/") });
export const useAuthors = () => useQuery({ queryKey: blogKeys.authors, queryFn: () => apiList<BlogAuthor>("cms/authors/") });
export const useTags = () => useQuery({ queryKey: blogKeys.tags, queryFn: () => apiList<BlogTag>("cms/tags/") });

function useInvalidate() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: [QK.cms] });
}

/** Create (no id) or update an article; answers with the saved article. */
export function useSaveArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: ArticleInput & { id?: string | null }) =>
      id ? api<Article>(`cms/articles/${id}/`, { method: "PATCH", body: input }) : api<Article>("cms/articles/", { method: "POST", body: input }),
    onSuccess: (article) => {
      qc.setQueryData(blogKeys.article(article.id), article);
      qc.invalidateQueries({ queryKey: blogKeys.articles });
    },
  });
}

export function useArticleAction() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, action }: { id: string; action: "publish" | "archive" | "delete" }) =>
      action === "delete" ? api(`cms/articles/${id}/`, { method: "DELETE" }) : api<Article>(`cms/articles/${id}/${action}/`, { method: "POST", body: {} }),
    onSuccess: invalidate,
  });
}

type Dict = "categories" | "authors" | "tags";

/** CRUD for the blog dictionaries: categories, authors, tags (tags have no edit on the backend). */
export function useSaveDict<T extends { id: string }>(dict: Dict) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, ...input }: Partial<T> & { id?: string }) =>
      id ? api<T>(`cms/${dict}/${id}/`, { method: "PATCH", body: input }) : api<T>(`cms/${dict}/`, { method: "POST", body: input }),
    onSuccess: invalidate,
  });
}

export function useDeleteDict(dict: Dict) {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: (id: string) => api(`cms/${dict}/${id}/`, { method: "DELETE" }), onSuccess: invalidate });
}

/** POST cms/media/: the image is compressed to WebP on the server; answers with its public URL. */
export const uploadBlogImage = (file: File) => apiUpload<{ url: string }>("cms/media/", file).then((r) => r.url);

export const useUploadImage = () => useMutation({ mutationFn: uploadBlogImage });

const translit: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z", и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", ң: "n", о: "o", ө: "o",
  п: "p", р: "r", с: "s", т: "t", у: "u", ү: "u", ф: "f", х: "h", ц: "c", ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
};

/** «Как МУИТ перешёл…» → «kak-muit-pereshel». */
export const slugify = (s: string, max = 80) =>
  s
    .toLowerCase()
    .split("")
    .map((ch) => translit[ch] ?? ch)
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, max);

/** Category tag colours of the blog design, rotated by position. */
const TAG_TONES = [
  { bg: "var(--color-green-100)", fg: "var(--color-green-700)" },
  { bg: "var(--color-brand-50)", fg: "var(--color-brand)" },
  { bg: "var(--color-purple-50)", fg: "var(--color-purple-600)" },
  { bg: "var(--color-orange-50)", fg: "var(--color-orange-600)" },
];

export const categoryTone = (categories: { id: string }[], id: string) => TAG_TONES[Math.max(0, categories.findIndex((c) => c.id === id)) % TAG_TONES.length];
