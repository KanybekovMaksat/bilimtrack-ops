/** Posts in the client organizations' forums, authored by the official Bilimtrack account. */

export type ForumPostType = "standard" | "news";
export type ForumCategory = "general" | "event" | "article";
/** `scheduled` = published with a future date; the feed hides it until then. */
export type ForumPublicationState = "published" | "scheduled" | "draft";

/** ForumAccountSerializer (`ops/forum/account/`). */
export type ForumAccount = {
  account: { id: number; username: string };
  organizations: {
    id: number;
    name: string;
    slug: string;
    /** The account already has the publisher role there; otherwise the first post grants it. */
    isConnected: boolean;
  }[];
};

/** ForumVideoSerializer. */
export type ForumVideo = {
  url: string;
  durationSeconds: number;
  posterUrl: string | null;
  /** Transcoded to MP4 720p; until then `url` is the original upload. */
  isProcessed: boolean;
};

/** ForumPublicationSerializer (`ops/forum/posts/`). */
export type ForumPublication = {
  id: number;
  organization: { id: number; name: string };
  postType: ForumPostType;
  title: string;
  text: string;
  category: ForumCategory;
  isPinned: boolean;
  status: string;
  state: ForumPublicationState;
  audienceRoles: string[];
  publishedAt: string;
  images: { id: number; url: string }[];
  videos: ForumVideo[];
  likesCount: number;
  commentsCount: number;
  viewsCount: number;
  sharesCount: number;
};

export type ForumPublicationsQuery = {
  organizationId?: number;
  postType?: ForumPostType;
  q?: string;
  page: number;
};

export type PublishForumInput = {
  organizationIds: number[];
  postType: ForumPostType;
  title: string;
  text: string;
  category: ForumCategory;
  isPinned: boolean;
  /** ISO date-time; empty = right now. */
  publishedAt: string;
  images: File[];
  video: File | null;
};

export type UpdateForumInput = {
  title?: string;
  text: string;
  category: ForumCategory;
  isPinned?: boolean;
  keepImageIds: number[];
  images: File[];
  removeVideo: boolean;
  video: File | null;
};

export const POST_TYPE_LABEL: Record<ForumPostType, string> = { standard: "Пост", news: "Новость" };

export const CATEGORY_LABEL: Record<ForumCategory, string> = {
  general: "Общее",
  event: "Событие",
  article: "Статья",
};

export const STATE_LABEL: Record<ForumPublicationState, { label: string; tone: "success" | "info" | "neutral" }> = {
  published: { label: "Опубликовано", tone: "success" },
  scheduled: { label: "Запланировано", tone: "info" },
  draft: { label: "Черновик", tone: "neutral" },
};

/** Backend limits (`MAX_IMAGES_PER_POST`, `FORUM_VIDEO_MAX_*`): checked here only to fail before a long upload. */
export const MAX_IMAGES = 10;
export const MAX_VIDEO_SECONDS = 30 * 60;
export const MAX_VIDEO_BYTES = 1024 * 1024 * 1024;
export const IMAGE_ACCEPT = "image/*,.heic,.heif";
export const VIDEO_ACCEPT = "video/mp4,video/quicktime,.mp4,.mov,.m4v";

/** `12:34` / `1:02:03`. */
export function formatDuration(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const rest = String(s % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${rest}` : `${m}:${rest}`;
}

function appendCommon(form: FormData, fields: Record<string, string | number | boolean | undefined>) {
  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined) form.append(key, String(value));
  }
}

/** Multipart body for `POST ops/forum/posts/`; news-only fields are left out of a plain post. */
export function toPublishForm(input: PublishForumInput): FormData {
  const form = new FormData();
  const news = input.postType === "news";
  input.organizationIds.forEach((id) => form.append("organizationIds", String(id)));
  appendCommon(form, {
    postType: input.postType,
    text: input.text,
    category: input.category,
    title: news ? input.title : undefined,
    isPinned: news ? input.isPinned : undefined,
    publishedAt: news && input.publishedAt ? new Date(input.publishedAt).toISOString() : undefined,
  });
  input.images.forEach((file) => form.append("images", file));
  if (input.video) form.append("video", input.video);
  return form;
}

/** Multipart body for `PATCH ops/forum/posts/<id>/`. An empty `keepImageIds` value means «drop every photo». */
export function toUpdateForm(input: UpdateForumInput): FormData {
  const form = new FormData();
  appendCommon(form, {
    text: input.text,
    category: input.category,
    title: input.title,
    isPinned: input.isPinned,
    removeVideo: input.removeVideo,
  });
  if (input.keepImageIds.length) input.keepImageIds.forEach((id) => form.append("keepImageIds", String(id)));
  else form.append("keepImageIds", "");
  input.images.forEach((file) => form.append("images", file));
  if (input.video) form.append("video", input.video);
  return form;
}
