import { SERVICE_STATE, useSystemStatus } from "@/entities/platform";
import { Card, PageHeader, Pill } from "@/shared/ui";

export function SystemPage() {
  const services = useSystemStatus();
  return (
    <div className="flex max-w-[820px] flex-col gap-4">
      <PageHeader title="Статус системы" subtitle="обновлено 30 секунд назад" />
      <Card className="overflow-hidden">
        {services.map((s) => {
          const st = SERVICE_STATE[s.state];
          return (
            <div key={s.name} className="flex items-center gap-3.5 border-b border-neutral-50 px-[18px] py-[15px] last:border-b-0">
              <span className="size-2.5 shrink-0 rounded-full" style={{ background: st.dot }} />
              <div className="flex-1">
                <div className="text-sm font-medium">{s.name}</div>
                <div className="text-xs text-neutral-500">{s.detail}</div>
              </div>
              <Pill size="lg" tone={st.tone}>
                {s.state}
              </Pill>
            </div>
          );
        })}
      </Card>
    </div>
  );
}
