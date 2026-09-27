import { CONNECT_STEPS, SERVICE_STATS, channelTone, useChannels } from "@/entities/channel";
import { Button, Card, Icon, PageHeader, Pill } from "@/shared/ui";

const STEP_TONE = {
  neutral: { bg: "#fff", bd: "#e5e5e5", fg: "#0a0a0a" },
  brand: { bg: "#eff6ff", bd: "#155dfc", fg: "#155dfc" },
  success: { bg: "#f0fdf4", bd: "#00c951", fg: "#00a63e" },
};

export function ChannelsPage() {
  const channels = useChannels();
  return (
    <div className="flex max-w-[1080px] flex-col gap-4">
      <PageHeader title="Каналы" subtitle="Instagram и WhatsApp как рабочие каналы связи, не SMM" />
      <div className="grid grid-cols-3 items-start gap-3.5">
        {channels.map((c) => (
          <div key={c.name} className="flex flex-col gap-3 rounded-2xl border p-[18px]" style={{ borderColor: c.status === "Подключён" ? "#e5e5e5" : "#fd9a00" }}>
            <div className="flex items-center gap-2.5">
              <Icon name={c.icon} size={24} style={{ color: c.color }} />
              <div className="flex-1">
                <div className="text-[15px] font-semibold">{c.name}</div>
                <div className="font-num text-xs text-neutral-500">{c.account}</div>
              </div>
            </div>
            <Pill size="lg" tone={channelTone[c.status]} className="self-start">
              {c.status}
            </Pill>
            <div className="min-h-[54px] text-xs leading-[18px] text-neutral-600">{c.note}</div>
            <div className="text-xs text-neutral-400">Отвечают: {c.responders}</div>
            <Button size="md">{c.status === "Подключён" ? "Настройки" : "Переподключить"}</Button>
            {c.service && (
              <div className="border-t border-neutral-100 pt-3">
                <div className="mb-2 text-[13px] font-medium">Служебные уведомления</div>
                <div className="flex gap-3.5">
                  {SERVICE_STATS.map((v) => (
                    <div key={v.label}>
                      <div className="font-num text-[15px] font-semibold">{v.n}</div>
                      <div className="text-[10px] leading-[14px] text-neutral-400">{v.label}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-2.5 text-[11px] leading-4 text-warn">Если канал отвалится, перестанет работать оплаченная фича PRO — это попадёт в очередь работы на главной.</div>
              </div>
            )}
          </div>
        ))}
      </div>
      <Card className="p-[18px]">
        <div className="mb-1 text-sm font-medium">Подключение канала — три состояния</div>
        <div className="mb-3.5 text-xs text-neutral-500">Вход происходит на стороне Meta: пользователь уходит из панели и возвращается.</div>
        <div className="grid grid-cols-3 gap-3">
          {CONNECT_STEPS.map((s) => {
            const t = STEP_TONE[s.tone];
            return (
              <div key={s.n} className="flex flex-col gap-1.5 rounded-[14px] border p-3.5" style={{ background: t.bg, borderColor: t.bd }}>
                <div className="flex items-center gap-2">
                  <span className="flex size-5 items-center justify-center rounded-full text-[11px] font-semibold text-white" style={{ background: t.fg }}>
                    {s.n}
                  </span>
                  <span className="text-[13px] font-semibold" style={{ color: t.fg }}>
                    {s.label}
                  </span>
                </div>
                <div className="text-xs leading-[18px] text-neutral-600">{s.desc}</div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
