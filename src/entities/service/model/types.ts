export type ServiceStatus = "operational" | "degraded" | "outage";

export type Service = {
  id: string;
  name: string;
  description: string;
  host: string;
  status: ServiceStatus;
  /** Uptime over the last 30 days, percent. */
  uptime: number;
  latencyMs: number;
  checkedAt: string;
};

export const serviceStatusLabel: Record<ServiceStatus, string> = {
  operational: "Работает",
  degraded: "Деградация",
  outage: "Недоступен",
};
