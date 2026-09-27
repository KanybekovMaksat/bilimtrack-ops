import { useState } from "react";
import { useNavigate } from "react-router";
import { routes } from "@/shared/config";
import { Button, Callout, Icon, Modal, ModalActions, Segmented, SummaryGrid, TextArea } from "@/shared/ui";
import { IMPERSONATION_BASIS, modeLabel, useImpersonation, type ImpersonationMode } from "./model";

type Target = { login: string; name: string; org: string; role: string };

/** "Войти от имени" — opens the reason/mode dialog and starts an audited session. */
export function ImpersonateButton({ target }: { target: Target }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<ImpersonationMode>("view");
  const [reason, setReason] = useState("");
  const start = useImpersonation((s) => s.start);
  const navigate = useNavigate();
  const canStart = reason.trim().length > 0;

  return (
    <>
      <Button icon="user-shield" onClick={() => setOpen(true)}>
        Войти от имени
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} width={540} title={`Войти от имени ${target.login}`}>
        <SummaryGrid
          rows={[
            ["Пользователь", target.name],
            ["Организация", `${target.org} · ${target.role}`],
            ["Длительность", "30 минут, затем сеанс завершится сам"],
          ]}
        />
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold text-neutral-500">Режим</span>
          <Segmented<ImpersonationMode>
            value={mode}
            onChange={setMode}
            options={[
              { value: "view", label: "Только просмотр", icon: "eye" },
              { value: "full", label: "Полный доступ", icon: "pencil" },
            ]}
          />
        </div>
        {mode === "full" && (
          <Callout tone="danger">
            Действия выполняются от имени пользователя: сообщения, изменения профиля, оплаты. Каждое действие попадёт в журнал с пометкой «от имени».
          </Callout>
        )}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-neutral-500">Основание</span>
          <div className="flex h-10 items-center gap-2 rounded-full border border-neutral-200 px-4 text-[13px]">
            <Icon name="lifebuoy" size={16} className="text-brand" />
            <span className="font-num text-xs text-neutral-500">{IMPERSONATION_BASIS.id}</span>
            <span className="flex-1 truncate">{IMPERSONATION_BASIS.subject}</span>
            <Icon name="chevron-down" className="text-neutral-400" />
          </div>
        </div>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-neutral-500">Причина · обязательно</span>
          <TextArea look="plain" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Что нужно проверить глазами пользователя" className="min-h-[72px]" />
        </label>
        <Callout tone="muted" icon="history" iconClassName="text-neutral-400 self-start">
          В журнал аудита запишутся: кто вошёл, от чьего имени, режим, причина, время начала и конца и все открытые страницы. Пользователь увидит сеанс в истории входов.
        </Callout>
        <ModalActions>
          <Button size="xl" onClick={() => setOpen(false)}>
            Отмена
          </Button>
          <Button
            size="xl"
            variant="primary"
            disabled={!canStart}
            onClick={() => {
              start(target.login, mode, reason);
              setOpen(false);
              setReason("");
              navigate(routes.accountSession(target.login));
            }}
          >
            Начать сеанс
          </Button>
        </ModalActions>
      </Modal>
    </>
  );
}

/** Sticky warning shown on every page while an impersonation session is running. */
export function ImpersonationBanner() {
  const session = useImpersonation((s) => s.session);
  const end = useImpersonation((s) => s.end);
  const navigate = useNavigate();
  if (!session) return null;

  return (
    <div className="-mt-2 mb-[18px] flex items-center gap-2.5 rounded-xl border border-amber-500 bg-amber-50 py-[9px] pr-2.5 pl-3.5 text-[13px]">
      <Icon name="user-shield" size={18} className="text-warn" />
      <span className="flex-1">
        <span className="font-semibold">Сеанс от имени {session.login}</span> · МУИТ · {modeLabel(session.mode)} · до 14:51 · основание {session.basis}. Все действия пишутся в журнал.
      </span>
      <Button size="xs" onClick={() => navigate(routes.accountSession(session.login))}>
        Журнал сеанса
      </Button>
      <Button
        size="xs"
        variant="danger"
        onClick={() => {
          end();
          navigate(routes.account(session.login));
        }}
      >
        Завершить
      </Button>
    </div>
  );
}

export function EndImpersonationButton() {
  const session = useImpersonation((s) => s.session);
  const end = useImpersonation((s) => s.end);
  const navigate = useNavigate();
  return (
    <Button
      variant="dangerOutline"
      onClick={() => {
        const login = session?.login ?? "a.kaliyeva";
        end();
        navigate(routes.account(login));
      }}
    >
      Завершить сеанс
    </Button>
  );
}
