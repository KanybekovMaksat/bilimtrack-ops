import { useState } from "react";
import { formatDateTimeShort } from "@/shared/lib";
import { Button } from "@/shared/ui";

/* Finik webhook body: the fields support actually looks at, then the full
   JSON on demand. Raw bodies are stored verbatim (signature checks need the
   exact bytes), so a body that is not JSON is shown as is. */

type FinikBody = {
  status?: string;
  amount?: number;
  transactionId?: string;
  transactionDate?: number;
  fields?: { paymentId?: string; name?: string; qrComment?: string };
  data?: { description?: string };
};

function parse(body: string): FinikBody | null {
  try {
    const value: unknown = JSON.parse(body);
    return value && typeof value === "object" && !Array.isArray(value) ? (value as FinikBody) : null;
  } catch {
    return null;
  }
}

function Row({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <>
      <span className="text-neutral-400">{k}</span>
      <span className="min-w-0 break-all">{children}</span>
    </>
  );
}

export function WebhookBody({ body }: { body: string }) {
  const [raw, setRaw] = useState(false);
  const parsed = body ? parse(body) : null;

  if (!body) return <div className="text-xs text-neutral-400">(пустое тело)</div>;

  const pre = (text: string) => (
    <pre className="m-0 max-h-72 overflow-auto rounded-md bg-neutral-50 p-2.5 font-mono text-[11px] leading-4 whitespace-pre-wrap break-all text-neutral-700">
      {text}
    </pre>
  );

  if (!parsed) return pre(body);

  const date = typeof parsed.transactionDate === "number" ? new Date(parsed.transactionDate).toISOString() : null;
  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-[110px_1fr] gap-x-3 gap-y-1 text-xs">
        {parsed.status && <Row k="Статус Finik">{parsed.status}</Row>}
        {typeof parsed.amount === "number" && (
          <Row k="Сумма">
            <span className="font-num">{parsed.amount.toLocaleString("ru-RU", { maximumFractionDigits: 2 })} KGS</span>
          </Row>
        )}
        {date && <Row k="Дата оплаты">{formatDateTimeShort(date)}</Row>}
        {parsed.transactionId && (
          <Row k="Транзакция">
            <span className="font-num">{parsed.transactionId}</span>
          </Row>
        )}
        {parsed.fields?.paymentId && (
          <Row k="ID платежа">
            <span className="font-num">{parsed.fields.paymentId}</span>
          </Row>
        )}
        {(parsed.data?.description || parsed.fields?.name) && <Row k="Назначение">{parsed.data?.description || parsed.fields?.name}</Row>}
        {parsed.fields?.qrComment && <Row k="Комментарий">{parsed.fields.qrComment}</Row>}
      </div>
      <div>
        <Button variant="ghost" size="xs" icon={raw ? "chevron-up" : "chevron-down"} onClick={() => setRaw(!raw)}>
          {raw ? "Скрыть JSON" : "Весь JSON"}
        </Button>
      </div>
      {raw && pre(JSON.stringify(parsed, null, 2))}
    </div>
  );
}
