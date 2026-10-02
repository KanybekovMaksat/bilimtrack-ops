import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, apiPage, QK } from "@/shared/api";
import {
  toPublishForm,
  toUpdateForm,
  type ForumAccount,
  type ForumPublication,
  type ForumPublicationsQuery,
  type PublishForumInput,
  type UpdateForumInput,
} from "./model";

const BASE = "ops/forum";
export const FORUM_PAGE = 20;

export const forumKeys = {
  account: [QK.forumAccount] as const,
  all: [QK.forumPublications] as const,
  list: (q: ForumPublicationsQuery) => [QK.forumPublications, q] as const,
};

export const useForumAccount = () =>
  useQuery({ queryKey: forumKeys.account, queryFn: () => api<ForumAccount>(`${BASE}/account/`), retry: false });

export const useForumPublications = (q: ForumPublicationsQuery) =>
  useQuery({
    queryKey: forumKeys.list(q),
    queryFn: () => apiPage<ForumPublication>(`${BASE}/posts/`, { ...q, page_size: FORUM_PAGE }),
    placeholderData: keepPreviousData,
  });

function useForumMutation<I, O>(fn: (input: I) => Promise<O>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: forumKeys.all });
      // The first post in an organization grants the account its publisher role.
      qc.invalidateQueries({ queryKey: forumKeys.account });
    },
  });
}

export const usePublishForumPost = () =>
  useForumMutation((input: PublishForumInput) =>
    api<ForumPublication[]>(`${BASE}/posts/`, { method: "POST", body: toPublishForm(input) }),
  );

export const useUpdateForumPost = (id: number) =>
  useForumMutation((input: UpdateForumInput) =>
    api<ForumPublication>(`${BASE}/posts/${id}/`, { method: "PATCH", body: toUpdateForm(input) }),
  );

export const useDeleteForumPost = () =>
  useForumMutation((id: number) => api<void>(`${BASE}/posts/${id}/`, { method: "DELETE" }));
