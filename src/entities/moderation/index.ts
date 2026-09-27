import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, apiPage, QK } from "@/shared/api";

/* Content moderation across all organizations — ported from bilimtrack-admin (pages/support/moderation).
   Backend: server/apps/support (use_cases/moderation.py), /api/v1/support/moderation/*.
   Hiding, deleting and every opening of a private chat are written to the organization's audit log. */

export const MODERATION_PAGE = 20;

export type ModerationOrg = { id: number; name: string };
export type ModerationPerson = { id: number; username: string; fullName: string };

export type PostStatus = "published" | "draft" | "hidden" | "archived";
export type CommentStatus = "published" | "hidden" | "archived";

export type ModerationPost = {
  id: number;
  organization: ModerationOrg;
  author: ModerationPerson;
  postType: "standard" | "news";
  category: string;
  title: string;
  status: PostStatus;
  hiddenReason: string;
  text: string;
  parts: { position: number; text: string; images: string[] }[];
  commentsCount: number;
  likesCount: number;
  publishedAt: string;
  createdAt: string;
  deletedAt: string | null;
};

export type ModerationComment = {
  id: number;
  organization: ModerationOrg;
  author: ModerationPerson;
  post: { id: number; title: string; status: PostStatus };
  parentId: number | null;
  text: string;
  status: CommentStatus;
  hiddenReason: string;
  createdAt: string;
  deletedAt: string | null;
};

export type ModerationChat = {
  id: number;
  organization: ModerationOrg;
  type: "direct" | "group";
  name: string;
  teachingAssignmentId: number | null;
  participants: ModerationPerson[];
  messagesCount: number;
  lastMessageAt: string | null;
  createdAt: string;
};

export type ModerationMessage = {
  id: number;
  chatId: number;
  sender: ModerationPerson | null;
  text: string;
  replyTo: { id: number; sender: ModerationPerson | null; text: string; isDeleted: boolean } | null;
  attachments: { id: number; url: string | null; name: string; size: number; contentType: string }[];
  sentAt: string;
  editedAt: string | null;
  deletedAt: string | null;
};

export type ReportStatus = "open" | "resolved" | "rejected";

export type ModerationReport = {
  id: number;
  organization: ModerationOrg;
  reporter: ModerationPerson;
  reportedUser: ModerationPerson;
  targetType: "post" | "comment" | "user";
  reason: string;
  reasonLabel: string;
  details: string;
  status: ReportStatus;
  targetReportsCount: number;
  post: { id: number; title: string; status: PostStatus; text: string; images: string[] } | null;
  comment: { id: number; postId: number; text: string; status: CommentStatus } | null;
  resolvedBy: ModerationPerson | null;
  resolvedAt: string | null;
  resolutionNote: string;
  createdAt: string;
};

type Counters = { total: number; hidden: number; deleted: number };

export type ModerationUser = {
  account: {
    id: number;
    username: string;
    email: string;
    phone: string;
    isActive: boolean;
    lastLogin: string | null;
    memberships: { id: number; organization: ModerationOrg; status: string; roles: { id: number; name: string }[] }[];
    profiles: { id: number; profileType: "employee" | "learner" | "guardian"; fullName: string; organization: ModerationOrg }[];
  };
  forumPosts: Counters;
  forumComments: Counters;
  chats: { total: number; messagesTotal: number; messagesDeleted: number };
};

export type ModerationQuery = Record<string, string | number | undefined>;

const BASE = "support/moderation";
const keys = {
  all: [QK.moderation] as const,
  list: (kind: string, q: ModerationQuery) => [QK.moderation, kind, q] as const,
  chat: (id: number) => [QK.moderation, "chat", id] as const,
  messages: (id: number, q: ModerationQuery) => [QK.moderation, "chat", id, "messages", q] as const,
  user: (id: number) => [QK.moderation, "user", id] as const,
};

function useModerationList<T>(kind: string, path: string, q: ModerationQuery) {
  return useQuery({
    queryKey: keys.list(kind, q),
    queryFn: () => apiPage<T>(`${BASE}/${path}/`, { ...q, page_size: MODERATION_PAGE }),
    placeholderData: keepPreviousData,
  });
}

export const useModerationPosts = (q: ModerationQuery) => useModerationList<ModerationPost>("posts", "forum/posts", q);
export const useModerationComments = (q: ModerationQuery) => useModerationList<ModerationComment>("comments", "forum/comments", q);
export const useModerationChats = (q: ModerationQuery) => useModerationList<ModerationChat>("chats", "chats", q);
export const useModerationReports = (q: ModerationQuery) => useModerationList<ModerationReport>("reports", "reports", q);

export const useModerationChat = (id: number) => useQuery({ queryKey: keys.chat(id), queryFn: () => api<ModerationChat>(`${BASE}/chats/${id}/`) });

/** No background refetches: every read of a private chat is written to the audit log. */
export const useModerationMessages = (id: number, q: ModerationQuery) =>
  useQuery({
    queryKey: keys.messages(id, q),
    queryFn: () => apiPage<ModerationMessage>(`${BASE}/chats/${id}/messages/`, { ...q, page_size: MODERATION_PAGE }),
    placeholderData: keepPreviousData,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

export const useModerationUser = (id: number | null) =>
  useQuery({ queryKey: keys.user(id ?? 0), queryFn: () => api<ModerationUser>(`${BASE}/users/${id}/`), enabled: id !== null });

function useModerationMutation<V>(fn: (v: V) => Promise<unknown>) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: fn, onSuccess: () => qc.invalidateQueries({ queryKey: keys.all }) });
}

export const useHidePost = () =>
  useModerationMutation(({ id, reason }: { id: number; reason: string }) => api(`${BASE}/forum/posts/${id}/hide/`, { method: "POST", body: { reason } }));
export const useRestorePost = () => useModerationMutation((id: number) => api(`${BASE}/forum/posts/${id}/restore/`, { method: "POST", body: {} }));
export const useHideComment = () =>
  useModerationMutation(({ id, reason }: { id: number; reason: string }) => api(`${BASE}/forum/comments/${id}/hide/`, { method: "POST", body: { reason } }));
export const useRestoreComment = () => useModerationMutation((id: number) => api(`${BASE}/forum/comments/${id}/restore/`, { method: "POST", body: {} }));
export const useDeleteMessage = (chatId: number) =>
  useModerationMutation((messageId: number) => api(`${BASE}/chats/${chatId}/messages/${messageId}/`, { method: "DELETE" }));
export const useResolveReport = () =>
  useModerationMutation(({ id, accept, note, hideContent }: { id: number; accept: boolean; note: string; hideContent?: boolean }) =>
    api(`${BASE}/reports/${id}/${accept ? "accept" : "reject"}/`, { method: "POST", body: accept ? { note, hideContent: hideContent ?? true } : { note } }),
  );

export const POST_STATUS: Record<string, { label: string; tone: "success" | "neutral" | "warn" | "danger" }> = {
  published: { label: "Опубликован", tone: "success" },
  draft: { label: "Черновик", tone: "neutral" },
  hidden: { label: "Скрыт модератором", tone: "warn" },
  archived: { label: "Удалён автором", tone: "danger" },
};

export const REPORT_STATUS: Record<ReportStatus, { label: string; tone: "warn" | "success" | "neutral" }> = {
  open: { label: "Ожидает разбора", tone: "warn" },
  resolved: { label: "Меры приняты", tone: "success" },
  rejected: { label: "Отклонена", tone: "neutral" },
};

export const chatTitle = (chat: ModerationChat) => chat.name || chat.participants.map((p) => p.fullName).join(" и ") || `Чат #${chat.id}`;
