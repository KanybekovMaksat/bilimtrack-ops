import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { api, apiList, QK } from "@/shared/api";
import { toIdea, type ApiIdea, type Idea, type IdeaStatus } from "./model";

export const ideaKeys = { all: [QK.ideas] as const };

const fetchIdeas = async (): Promise<Idea[]> => (await apiList<ApiIdea>("ideas/")).map(toIdea);

export const useIdeas = () => useSuspenseQuery({ queryKey: ideaKeys.all, queryFn: fetchIdeas, refetchInterval: 60_000 }).data;

/** PATCH ideas/:id/ { status } — optimistic, rolls back if the server refuses. */
export function useUpdateIdeaStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: IdeaStatus }) =>
      api<ApiIdea>(`ideas/${id}/`, { method: "PATCH", body: { status } }),
    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey: ideaKeys.all });
      const prev = qc.getQueryData<Idea[]>(ideaKeys.all);
      qc.setQueryData<Idea[]>(ideaKeys.all, (list) => list?.map((i) => (i.id === id ? { ...i, status } : i)));
      return { prev };
    },
    onError: (_e, _v, ctx) => ctx?.prev && qc.setQueryData(ideaKeys.all, ctx.prev),
    onSettled: () => qc.invalidateQueries({ queryKey: ideaKeys.all }),
  });
}
