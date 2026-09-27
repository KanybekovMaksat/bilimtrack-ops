import { useMutation, useQueryClient } from "@tanstack/react-query";
import { teamKeys, type Operator } from "@/entities/operator";
import { useSession } from "@/entities/session";
import { api, apiUpload } from "@/shared/api";

/** Own profile: name and avatar. The session picks up the fresh operator, the team list is refetched. */
export function useUpdateMyProfile() {
  const setOperator = useSession((s) => s.setOperator);
  const qc = useQueryClient();
  const done = (me: Operator) => {
    setOperator(me);
    qc.invalidateQueries({ queryKey: teamKeys.list });
  };
  const names = useMutation({
    mutationFn: (input: { lastName: string; firstName: string; middleName: string }) =>
      api<Operator>("ops/me/profile/", { method: "PATCH", body: input }),
    onSuccess: done,
  });
  const avatar = useMutation({
    mutationFn: (file: File | null) => (file ? apiUpload<Operator>("ops/me/avatar/", file) : api<Operator>("ops/me/avatar/", { method: "DELETE" })),
    onSuccess: done,
  });
  return { names, avatar };
}
