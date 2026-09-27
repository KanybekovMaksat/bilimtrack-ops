import { useSearchParams } from "react-router";
import type { TicketFilters, TicketPriority, TicketStatus } from "@/entities/ticket";

/** Ticket filters live in the URL so filtered views can be shared by link. */
export function useTicketFilters() {
  const [params, setParams] = useSearchParams();

  const filters: TicketFilters = {
    search: params.get("q") ?? undefined,
    status: (params.get("status") as TicketStatus | null) ?? undefined,
    priority: (params.get("priority") as TicketPriority | null) ?? undefined,
    organizationId: params.get("org") ?? undefined,
  };

  const setFilter = (key: "q" | "status" | "priority" | "org", value: string) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value) next.set(key, value);
        else next.delete(key);
        return next;
      },
      { replace: true },
    );

  const reset = () => setParams({}, { replace: true });
  const isActive = [...params.keys()].length > 0;

  return { filters, setFilter, reset, isActive };
}
