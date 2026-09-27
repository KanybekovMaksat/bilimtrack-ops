import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ticketApi, ticketKeys, type UpdateTicketInput } from "@/entities/ticket";

export function useUpdateTicket(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (patch: UpdateTicketInput) => ticketApi.update(id, patch),
    onSuccess: (ticket) => {
      queryClient.setQueryData(ticketKeys.detail(id), ticket);
      queryClient.invalidateQueries({ queryKey: ticketKeys.all });
    },
  });
}
