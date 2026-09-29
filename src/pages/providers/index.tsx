import { useState } from "react";
import { PAYMENTS_PAGE_SIZE, useWebhooks, webhookOutcomeLabel, webhookTone, type WebhookFilters } from "@/entities/payment";
import { useBillingSummary } from "@/entities/subscription";
import { formatDateLong, formatDateTimeShort, formatInt } from "@/shared/lib";
import { Callout, Card, Cell, EmptyState, FilterChip, Num, PageHeader, Pager, Pill, Row, SearchInput, StatusDot, Table } from "@/shared/ui";

export function ProvidersPage() {
  const summary = useBillingSummary();
  const [outcome, setOutcome] = useState<WebhookFilters["outcome"]>();
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState<number | null>(null);
  const webhooks = useWebhooks({ outcome, q: query.trim().length >= 2 ? query.trim() : undefined, page });
  const s = summary.data;
  const total = webhooks.data?.count ?? 0;

  return (
    <div className="flex max-w-[1100px] flex-col gap-4">
      <PageHeader title="Провайдер оплаты" subtitle="Finik Acquiring (QR) · деньги поступают на счёт BilimTrack" />
      <Card className="flex items-center gap-4 px-[18px] py-3.5">
        <div className="w-[220px]">
          <StatusDot color={s?.provider.configured ? "var(--color-green-500)" : "var(--color-red-500)"} className="text-sm font-medium text-ink">
            Finik
          </StatusDot>
          <div className="text-[11px] text-neutral-500">
            {!s ? "…" : s.provider.configured ? `настроен · среда ${s.provider.environment}` : "ключи не заданы — оплата выключена"}
          </div>
        </div>
        <div className="w-[160px]">
          <div className="font-num text-[13px]">{s ? formatInt(s.pendingPayments) : "—"}</div>
          <div className="text-[11px] text-neutral-400">ждут оплаты сейчас</div>
        </div>
        <div className="w-[190px]">
          <div className={s?.webhooksNeedAttention ? "font-num text-[13px] text-red-600" : "font-num text-[13px] text-neutral-400"}>
            {s ? formatInt(s.webhooksNeedAttention) : "—"}
          </div>
          <div className="text-[11px] text-neutral-400">вебхуков требуют внимания (30 дн.)</div>
        </div>
        <div className="flex-1 text-right text-[11px] text-neutral-400">Пробный период: {s ? `${s.trialDays} дн.` : "—"}</div>
      </Card>
      {s && !s.provider.configured && (
        <Callout tone="warn">
          Пока в config/.env сервера не заданы FINIK_API_KEY, FINIK_PRIVATE_KEY, FINIK_ACCOUNT_ID и FINIK_WEBHOOK_URL, студенты видят на экране оплаты
          «Раздел в разработке».
        </Callout>
      )}
      {s && s.paywallOrganizations.length > 0 && (
        <Callout tone="info">
          Обязательная подписка включена: {s.paywallOrganizations.map((o) => (o.requiredFrom ? `${o.name} (с ${formatDateLong(o.requiredFrom)})` : o.name)).join(", ")}
        </Callout>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <SearchInput width={260} placeholder="ID транзакции или текст тела" value={query} onChange={(v) => { setQuery(v); setPage(1); }} />
        <FilterChip icon="alert-triangle" label="Требуют внимания" tone={outcome === "attention" ? "warn" : "default"} onClick={() => { setOutcome(outcome === "attention" ? undefined : "attention"); setPage(1); }} />
        <FilterChip label="Проведённые" tone={outcome === "processed" ? "active" : "default"} onClick={() => { setOutcome(outcome === "processed" ? undefined : "processed"); setPage(1); }} />
      </div>

      {webhooks.error ? (
        <Callout tone="danger">{webhooks.error.message}</Callout>
      ) : webhooks.data && !webhooks.data.rows.length ? (
        <div className="rounded-xl border border-neutral-200">
          <EmptyState icon="plug" title="Вебхуков нет" description="Finik присылает вебхук только об успешной оплате." />
        </div>
      ) : (
        <Table cols="140px 170px minmax(160px,1fr) minmax(200px,1.4fr) 90px" minWidth={900} head={["Получен", "Результат", "Транзакция", "Комментарий", "Подпись"]}>
          {(webhooks.data?.rows ?? []).map((e) => (
            <div key={e.id}>
              <Row onClick={() => setOpen(open === e.id ? null : e.id)}>
                <span className="text-xs text-neutral-500">{formatDateTimeShort(e.receivedAt)}</span>
                <span>
                  <Pill size="sm" tone={webhookTone[e.outcome] ?? "neutral"}>
                    {webhookOutcomeLabel[e.outcome] ?? e.outcome}
                  </Pill>
                </span>
                <Num className="truncate text-neutral-500">{e.transactionId || "—"}</Num>
                <Cell className="text-xs text-neutral-600">{e.detail || "—"}</Cell>
                <span className={e.signatureValid ? "text-xs text-green-600" : "text-xs text-red-600"}>{e.signatureValid ? "верна" : "неверна"}</span>
              </Row>
              {open === e.id && (
                <pre className="m-0 max-h-60 overflow-auto border-b border-neutral-100 bg-neutral-50 px-4 py-2.5 font-mono text-[11px] leading-4 text-neutral-700">{e.body || "(пустое тело)"}</pre>
              )}
            </div>
          ))}
          {webhooks.isLoading && <div className="h-40 animate-pulse bg-neutral-50" />}
        </Table>
      )}
      {total > PAYMENTS_PAGE_SIZE && <Pager page={page} pageSize={PAYMENTS_PAGE_SIZE} total={total} onPage={setPage} />}
    </div>
  );
}
