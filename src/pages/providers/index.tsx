import { useState } from "react";
import { PROVIDER_HEALTH, usePaymentProviders } from "@/entities/payment";
import { Card, PageHeader, Toggle } from "@/shared/ui";

export function ProvidersPage() {
  const providers = usePaymentProviders();
  const [enabled, setEnabled] = useState<Record<string, boolean>>(() => Object.fromEntries(providers.map((p) => [p.name, p.enabled])));

  return (
    <div className="flex max-w-[900px] flex-col gap-4">
      <PageHeader title="Провайдеры" subtitle="тот же паттерн, что у «Статуса системы»" />
      <Card className="overflow-hidden">
        {providers.map((p) => {
          const h = PROVIDER_HEALTH[p.status];
          return (
            <div key={p.name} className="flex items-center gap-3.5 border-b border-neutral-50 px-[18px] py-3.5 last:border-b-0">
              <span className="size-[9px] shrink-0 rounded-full" style={{ background: h.dot }} />
              <div className="w-[190px]">
                <div className="text-sm font-medium">{p.name}</div>
                <div className="text-[11px]" style={{ color: h.fg }}>
                  {p.status}
                </div>
              </div>
              <div className="w-[180px]">
                <div className="text-[13px]">{p.lastWebhook}</div>
                <div className="text-[11px] text-neutral-400">последний вебхук</div>
              </div>
              <div className="w-[110px]">
                <div className={`font-num text-[13px] ${p.errors === "0" ? "text-neutral-400" : "text-red-600"}`}>{p.errors}</div>
                <div className="text-[11px] text-neutral-400">ошибок за сутки</div>
              </div>
              <div className="w-[90px]">
                <div className="font-num text-[13px]">{p.share}</div>
                <div className="text-[11px] text-neutral-400">доля платежей</div>
              </div>
              <div className="ml-auto">
                <Toggle on={enabled[p.name]} label={`Провайдер ${p.name}`} onChange={(on) => setEnabled((e) => ({ ...e, [p.name]: on }))} />
              </div>
            </div>
          );
        })}
      </Card>
    </div>
  );
}
