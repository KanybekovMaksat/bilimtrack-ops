import { useState } from "react";
import { cn, plural, toggleIn } from "@/shared/lib";
import { Button, Callout, Field, Icon, Modal, ModalActions, TextArea, TextInput } from "@/shared/ui";

const CHANNELS = [
  { label: "Push в приложении", icon: "bell" },
  { label: "Email", icon: "mail" },
  { label: "Telegram", icon: "brand-telegram" },
  { label: "WhatsApp", icon: "brand-whatsapp" },
];

type Props = { open: boolean; onClose: () => void; recipients: number };

/** Broadcast to selected users with per-person substitutions. */
export function BroadcastModal({ open, onClose, recipients }: Props) {
  const [channels, setChannels] = useState(["Push в приложении", "Email"]);
  const [title, setTitle] = useState("Обновление расписания на октябрь");
  const [text, setText] = useState(
    "Здравствуйте, [имя]! С 1 октября расписание в [организация] формируется по новым правилам — проверьте свои занятия в приложении.",
  );
  const preview = text.replaceAll("[имя]", "Динара").replaceAll("[организация]", "Comtehno");

  return (
    <Modal open={open} onClose={onClose} width={560} title={`Рассылка · ${recipients} ${plural(recipients, ["получатель", "получателя", "получателей"])}`}>
      <div>
        <div className="mb-1.5 text-xs text-neutral-500">Каналы</div>
        <div className="flex flex-wrap gap-1.5">
          {CHANNELS.map((c) => {
            const on = channels.includes(c.label);
            return (
              <button
                key={c.label}
                onClick={() => setChannels(toggleIn(channels, c.label))}
                className={cn(
                  "flex h-[34px] items-center gap-1.5 rounded-full border px-[13px] text-[13px] font-medium",
                  on ? "border-brand bg-brand-50 text-brand" : "border-neutral-200 bg-white text-neutral-700",
                )}
              >
                <Icon name={c.icon} size={16} />
                {c.label}
              </button>
            );
          })}
        </div>
      </div>
      <Field label="Заголовок">
        <TextInput inputSize="md" value={title} onChange={(e) => setTitle(e.target.value)} />
      </Field>
      <Field label="Текст · доступны подстановки [имя], [организация]">
        <TextArea className="min-h-[90px]" value={text} onChange={(e) => setText(e.target.value)} />
      </Field>
      <div className="rounded-[14px] border border-neutral-200 bg-green-50 p-3 text-[13px] leading-5">{preview}</div>
      <Callout tone="danger">Отправка необратима. У 1 получателя нет привязанного Telegram — ему уйдёт только push.</Callout>
      <ModalActions>
        <Button size="xl" onClick={onClose}>
          Отмена
        </Button>
        <Button size="xl" variant="primary" disabled={!channels.length || !text.trim()} onClick={onClose}>
          Отправить
        </Button>
      </ModalActions>
    </Modal>
  );
}
