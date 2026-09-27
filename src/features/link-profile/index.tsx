import { useState } from "react";
import { ORPHAN_PROFILE, useProfileLink, type Account } from "@/entities/account";
import { Button, Callout, Icon, KV, Modal, ModalActions } from "@/shared/ui";

/** Links the orphan МУИТ profile to the account so the person can sign in again. */
export function LinkProfileButton({ account }: { account: Account }) {
  const [open, setOpen] = useState(false);
  const link = useProfileLink((s) => s.link);
  const p = ORPHAN_PROFILE;

  return (
    <>
      <Button variant="primary" icon="link" onClick={() => setOpen(true)}>
        Привязать профиль
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Привязать профиль к аккаунту" className="gap-4">
        <div className="overflow-hidden rounded-[14px] border border-neutral-200">
          <div className="flex items-center gap-3 border-b border-neutral-100 px-3.5 py-[13px]">
            <Icon name="user" size={19} className="text-neutral-500" />
            <div className="flex-1">
              <div className="text-[13px] font-medium">{p.name}</div>
              <div className="text-[11px] text-neutral-400">
                {p.type} · {p.org}
              </div>
            </div>
          </div>
          <div className="flex justify-center p-0.5">
            <Icon name="arrow-down" size={16} className="text-neutral-400" />
          </div>
          <div className="flex items-center gap-3 border-t border-neutral-100 px-3.5 py-[13px]">
            <Icon name="key" size={19} className="text-brand" />
            <div className="flex-1">
              <div className="font-num text-[13px] font-medium">{account.login}</div>
              <div className="text-[11px] text-neutral-400">
                {account.email} · {account.phone}
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <KV k="Организация">{p.org}</KV>
          <KV k="Роли">Учащийся</KV>
          <KV k="Членство">будет восстановлено как активное</KV>
        </div>
        <Callout tone="warn">
          После привязки человек получит доступ к данным {p.org} под логином {account.login}. <b>Пароль не меняется</b> — если он его не помнит, нужна отдельная процедура восстановления.
        </Callout>
        <ModalActions>
          <Button size="xl" onClick={() => setOpen(false)}>
            Отмена
          </Button>
          <Button
            size="xl"
            variant="primary"
            onClick={() => {
              link();
              setOpen(false);
            }}
          >
            Привязать профиль
          </Button>
        </ModalActions>
      </Modal>
    </>
  );
}
