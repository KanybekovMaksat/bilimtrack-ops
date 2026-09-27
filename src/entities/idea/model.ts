/* Ideas from users of every organization.
   Backend: server/apps/support (IdeaViewSet + IdeaOperatorSerializer), GET/PATCH /api/v1/ideas/. */

import type { PillTone } from "@/shared/ui";

export type IdeaStatus = "new" | "in_progress" | "rejected";

export const IDEA_STATUSES: IdeaStatus[] = ["new", "in_progress", "rejected"];

export const ideaStatusLabel: Record<IdeaStatus, string> = {
  new: "Новая",
  in_progress: "Взято в работу",
  rejected: "Отклонено",
};

export const ideaStatusTone: Record<IdeaStatus, PillTone> = {
  new: "solidBrand",
  in_progress: "info",
  rejected: "neutral",
};

/** Raw IdeaOperatorSerializer. */
export type ApiIdea = {
  id: number;
  message: string;
  status: IdeaStatus;
  attachments: { id: number; file: string }[];
  createdBy: { id: number; username: string; fullName: string; photo: string | null } | null;
  organization: { id: number; name: string } | null;
  createdAt: string;
  updatedAt: string;
};

export type IdeaAttachment = { id: number; url: string; name: string; isImage: boolean };

export type Idea = {
  id: number;
  text: string;
  status: IdeaStatus;
  author: { id: number; username: string; name: string; photo: string | null } | null;
  org: { id: number; name: string } | null;
  attachments: IdeaAttachment[];
  createdAt: string;
  updatedAt: string;
};

const IMAGE_RE = /\.(webp|png|jpe?g|gif|heic|heif|avif)(\?|$)/i;

export function toIdea(raw: ApiIdea): Idea {
  return {
    id: raw.id,
    text: raw.message,
    status: raw.status,
    author: raw.createdBy
      ? { id: raw.createdBy.id, username: raw.createdBy.username, name: raw.createdBy.fullName || raw.createdBy.username, photo: raw.createdBy.photo }
      : null,
    org: raw.organization,
    attachments: (raw.attachments ?? []).map((a) => {
      const name = decodeURIComponent(a.file.split("?")[0].split("/").pop() || "вложение");
      return { id: a.id, url: a.file, name, isImage: IMAGE_RE.test(a.file) };
    }),
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}
