import { useState } from "react";
import { useNavigate } from "react-router";
import { useTickets } from "@/entities/ticket";
import { routes } from "@/shared/config";
import { Button, EmptyState, PageHeader, Segmented, Table } from "@/shared/ui";
import { COMPACT_TICKET_COLS, COMPACT_TICKET_HEAD, CompactTicketRows } from "@/widgets/tickets-table";

type ListState = "loading" | "data" | "empty" | "nofilter" | "error";

const SKELETON_WIDTHS = [40, 53, 66, 79, 47, 60];

/** Reference screen: the five states every list in the panel goes through. */
export function TicketStatesPage() {
  const tickets = useTickets();
  const navigate = useNavigate();
  const [state, setState] = useState<ListState>("loading");

  return (
    <div className="flex max-w-[1080px] flex-col gap-4">
      <PageHeader
        title="Состояния списка"
        subtitle="один раз на примере тикетов — дальше повторяется везде"
        actions={
          <Button size="md" onClick={() => navigate(routes.ticketPriority)}>
            Шкала приоритетов →
          </Button>
        }
      />
      <Segmented<ListState>
        value={state}
        onChange={setState}
        options={[
          { value: "loading", label: "Загрузка" },
          { value: "data", label: "Есть данные" },
          { value: "empty", label: "Пусто" },
          { value: "nofilter", label: "Ничего не найдено" },
          { value: "error", label: "Ошибка" },
        ]}
      />
      <Table cols={COMPACT_TICKET_COLS} minWidth={880} head={COMPACT_TICKET_HEAD} className="min-h-80">
        {state === "loading" &&
          SKELETON_WIDTHS.map((w, i) => (
            <div key={i} className="grid gap-3 border-b border-neutral-100 p-3.5" style={{ gridTemplateColumns: COMPACT_TICKET_COLS, minWidth: 880 }}>
              {["80%", `${w}%`, "70%", "60%", "50%", "65%"].map((width, j) => (
                <span key={j} className="h-2.5 animate-pulse rounded-full bg-neutral-100" style={{ width }} />
              ))}
            </div>
          ))}
        {state === "data" && <CompactTicketRows tickets={tickets} />}
        {state === "empty" && (
          <EmptyState icon="inbox-off" title="Тикетов пока нет" description="Когда клиент напишет с сайта, из панели, Telegram или через API — обращение появится здесь." />
        )}
        {state === "nofilter" && (
          <EmptyState
            icon="filter-off"
            title="По вашим фильтрам ничего не найдено"
            description="Приоритет: Критический · Источник: API · Период: сегодня"
            action={
              <Button size="lg" className="text-[13px]" onClick={() => setState("data")}>
                Сбросить фильтры
              </Button>
            }
          />
        )}
        {state === "error" && (
          <EmptyState
            icon="alert-circle"
            iconClassName="text-red-500"
            title="Не удалось загрузить список"
            description="Сервер не ответил за 30 секунд. Код ошибки 504 · запрос GET /ops/tickets"
            action={
              <Button size="lg" variant="primary" className="text-[13px]" onClick={() => setState("loading")}>
                Повторить
              </Button>
            }
          />
        )}
      </Table>
    </div>
  );
}
