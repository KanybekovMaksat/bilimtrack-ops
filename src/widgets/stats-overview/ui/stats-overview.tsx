import type { LucideIcon } from "lucide-react";
import { AlertTriangle, Building2, GraduationCap, Ticket } from "lucide-react";
import { useOrganizations } from "@/entities/organization";
import { useServices } from "@/entities/service";
import { useTickets } from "@/entities/ticket";
import { formatNumber } from "@/shared/lib";
import { Card } from "@/shared/ui";

function Stat({ label, value, hint, icon: Icon }: { label: string; value: string; hint: string; icon: LucideIcon }) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between text-sm text-fg-muted">
        {label}
        <Icon className="size-4" />
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-tight tabular-nums">{value}</p>
      <p className="mt-1 text-xs text-fg-muted">{hint}</p>
    </Card>
  );
}

export function StatsOverview() {
  const { data: tickets = [] } = useTickets();
  const { data: organizations = [] } = useOrganizations();
  const { data: services = [] } = useServices();

  const openTickets = tickets.filter((t) => t.status === "open" || t.status === "in_progress");
  const critical = openTickets.filter((t) => t.priority === "critical").length;
  const active = organizations.filter((o) => o.status !== "churned");
  const students = active.reduce((sum, o) => sum + o.students, 0);
  const unhealthy = services.filter((s) => s.status !== "operational").length;

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Stat label="Открытые тикеты" value={String(openTickets.length)} hint={`${critical} критических`} icon={Ticket} />
      <Stat label="Организации" value={String(active.length)} hint={`${organizations.filter((o) => o.status === "trial").length} на пробном периоде`} icon={Building2} />
      <Stat label="Студентов на платформе" value={formatNumber(students)} hint="во всех активных организациях" icon={GraduationCap} />
      <Stat label="Проблемы сервисов" value={String(unhealthy)} hint={unhealthy ? "требуют внимания" : "все системы работают"} icon={AlertTriangle} />
    </div>
  );
}
