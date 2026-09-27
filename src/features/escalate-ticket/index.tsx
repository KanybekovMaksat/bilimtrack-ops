import { useState } from "react";
import { useEscalations, type Ticket } from "@/entities/ticket";
import { Button, Icon, Modal, ModalActions, StaticSelect } from "@/shared/ui";

/** "В бэклог разработки": creates a dev task linked to the ticket. */
export function EscalateTicketButton({ ticket }: { ticket: Ticket }) {
  const [open, setOpen] = useState(false);
  const [notifyUser, setNotifyUser] = useState(true);
  const escalate = useEscalations((s) => s.escalate);

  const attach = [
    { icon: "link", label: `Ссылка на ${ticket.id}` },
    { icon: "code", label: "Технические детали (JSON)" },
    { icon: "bug", label: "Похожие ошибки в Sentry · 3" },
  ];

  return (
    <>
      <Button icon="git-pull-request" onClick={() => setOpen(true)}>
        В бэклог разработки
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} width={540} title="Эскалировать в бэклог разработки">
        <div className="text-[13px] leading-5 text-neutral-700">
          Создаётся задача со ссылкой на {ticket.id}. Тикет остаётся у поддержки, в нём появится ссылка на задачу и её статус.
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-neutral-500">Название задачи</span>
          <div className="min-h-10 rounded-full border border-neutral-200 px-4 py-2.5 text-sm">{ticket.subject}</div>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-neutral-500">Приоритет разработки</span>
            <StaticSelect>P1 · в текущем спринте</StaticSelect>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-neutral-500">Команда</span>
            <StaticSelect>Мобильное приложение</StaticSelect>
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-neutral-500">Приложится автоматически</span>
          <div className="flex flex-wrap gap-1.5">
            {attach.map((a) => (
              <span key={a.label} className="inline-flex items-center gap-[5px] rounded-full bg-neutral-100 px-2.5 py-1 text-xs text-neutral-700">
                <Icon name={a.icon} size={14} />
                {a.label}
              </span>
            ))}
          </div>
        </div>
        <label className="flex items-center gap-2 text-[13px] text-neutral-700">
          <input type="checkbox" checked={notifyUser} onChange={(e) => setNotifyUser(e.target.checked)} className="accent-brand" />
          Написать пользователю: «Передали разработке, сообщим, когда исправим»
        </label>
        <ModalActions>
          <Button size="xl" onClick={() => setOpen(false)}>
            Отмена
          </Button>
          <Button
            size="xl"
            variant="primary"
            onClick={() => {
              escalate(ticket.id, ticket.subject);
              setOpen(false);
            }}
          >
            Создать задачу
          </Button>
        </ModalActions>
      </Modal>
    </>
  );
}
