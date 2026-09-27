import { cn } from "@/shared/lib";
import { serviceStatusLabel, type ServiceStatus } from "../model/types";

const dot: Record<ServiceStatus, string> = {
  operational: "bg-success",
  degraded: "bg-warning",
  outage: "bg-danger",
};

export function ServiceStatusIndicator({ status }: { status: ServiceStatus }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm">
      <span className={cn("size-2 rounded-full", dot[status])} />
      {serviceStatusLabel[status]}
    </span>
  );
}
