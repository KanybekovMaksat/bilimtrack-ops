import { useState } from "react";
import { templateTone, useMessageTemplates } from "@/entities/channel";
import { Button, Callout, Card, CardHeader, KV, PageHeader, Pill } from "@/shared/ui";

const COLS = "minmax(0,1fr) 120px 130px 90px";

export function TemplatesPage() {
  const data = useMessageTemplates();
  const [checked, setChecked] = useState(false);
  const [sent, setSent] = useState(false);

  return (
    <div className="flex max-w-[1080px] flex-col gap-4">
      <PageHeader
        title="Шаблоны и рассылки"
        actions={
          <>
            <Button>Новый шаблон</Button>
            <Button variant="primary">Новая рассылка</Button>
          </>
        }
      />
      <div className="grid grid-cols-[minmax(0,1fr)_380px] items-start gap-3.5">
        <Card className="overflow-hidden">
          <div className="grid gap-3 border-b border-neutral-200 bg-neutral-50 px-4 py-[9px] text-[11px] font-semibold text-neutral-500" style={{ gridTemplateColumns: COLS }}>
            <span>Шаблон</span>
            <span>Канал</span>
            <span>Статус</span>
            <span>Изменён</span>
          </div>
          {data.templates.map((t) => (
            <div key={t.name} className="cursor-pointer border-b border-neutral-100 px-4 py-[11px] hover:bg-neutral-50">
              <div className="grid items-center gap-3 text-[13px]" style={{ gridTemplateColumns: COLS }}>
                <span className="truncate">{t.name}</span>
                <span className="text-xs text-neutral-500">{t.channel}</span>
                <span>
                  <Pill tone={templateTone[t.status]}>{t.status}</Pill>
                </span>
                <span className="text-xs text-neutral-400">{t.updated}</span>
              </div>
              {t.reason && <div className="mt-2 rounded-[10px] bg-red-50 px-[11px] py-2 text-xs leading-[17px] text-red-600">Причина отклонения — {t.reason}</div>}
            </div>
          ))}
          <div className="px-4 py-3.5">
            <div className="mb-2 text-[13px] font-medium">Предпросмотр с подставленными значениями</div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-neutral-200 p-3 text-[13px] leading-5 text-neutral-600">{data.previewRaw}</div>
              <div className="rounded-xl border border-neutral-200 bg-green-50 p-3 text-[13px] leading-5">{data.previewFilled}</div>
            </div>
          </div>
        </Card>

        <div className="flex flex-col gap-3.5">
          <div className="overflow-hidden rounded-2xl border border-red-500">
            <div className="border-b border-neutral-100 bg-red-50 px-4 py-[13px] text-sm font-semibold text-red-600">Проверка перед отправкой</div>
            <div className="flex flex-col gap-2.5 p-4">
              {data.broadcast.map((r) => (
                <KV key={r.k} k={r.k} width={110}>
                  {r.v}
                </KV>
              ))}
              <Callout tone="dangerSoft" className="px-[13px] py-[11px]">
                Отправка необратима. 148 человек получат сообщение сразу, отменить или отозвать его нельзя.
              </Callout>
              <label className="flex items-start gap-2 text-xs leading-[18px] text-neutral-700">
                <input type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)} className="mt-0.5 accent-brand" />Я проверил текст и список получателей
              </label>
              {sent ? (
                <Callout tone="success" icon="circle-check">
                  Рассылка отправлена · 148 сообщений
                </Callout>
              ) : (
                <div className="flex gap-2">
                  <Button size="md" className="h-[38px] flex-1" onClick={() => setChecked(false)}>
                    Отмена
                  </Button>
                  <Button size="md" variant="danger" className="h-[38px] flex-1" disabled={!checked} onClick={() => setSent(true)}>
                    Отправить 148 сообщений
                  </Button>
                </div>
              )}
            </div>
          </div>
          <Card className="overflow-hidden">
            <CardHeader title="История рассылок" />
            {data.history.map((h) => (
              <div key={h.when} className="border-b border-neutral-50 px-4 py-3 last:border-b-0">
                <div className="text-[13px] font-medium">{h.name}</div>
                <div className="text-[11px] text-neutral-400">
                  {h.when} · {h.who} · {h.channel}
                </div>
                <div className="mt-1 text-xs text-neutral-500">
                  дошло {h.sent} · ошибок {h.failed}
                </div>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}
