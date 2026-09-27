import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { accountKeys, profileTypeLabel, searchAccounts, useLinkProfile, type Account, type Profile } from "@/entities/account";
import { cn } from "@/shared/lib";
import { Button, Callout, Icon, Modal, ModalActions, SearchInput } from "@/shared/ui";

/**
 * Finds an active profile that has no account (the usual "can't sign in" case)
 * and links it to this account: membership is created/restored with default roles.
 */
export function LinkProfileButton({ account }: { account: Account }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="primary" icon="link" onClick={() => setOpen(true)}>
        Привязать профиль
      </Button>
      {open && <LinkProfileModal account={account} onClose={() => setOpen(false)} />}
    </>
  );
}

function LinkProfileModal({ account, onClose }: { account: Account; onClose: () => void }) {
  const defaultQuery = account.phone || account.email || account.profiles[0]?.fullName || "";
  const [query, setQuery] = useState(defaultQuery);
  const [submitted, setSubmitted] = useState(defaultQuery);
  const [picked, setPicked] = useState<Profile | null>(null);
  const link = useLinkProfile(account.id);

  const found = useQuery({
    queryKey: accountKeys.search(submitted),
    queryFn: () => searchAccounts(submitted),
    enabled: submitted.trim().length >= 2,
  });
  const candidates = (found.data?.profiles ?? []).filter((p) => p.linkedUserId === null);

  return (
    <Modal open onClose={onClose} width={560} title="Привязать профиль к аккаунту">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitted(query.trim());
          setPicked(null);
        }}
        className="flex gap-2"
      >
        <SearchInput width={0} className="flex-1" placeholder="ФИО, телефон или почта из профиля" value={query} onChange={setQuery} />
        <Button type="submit" size="md" disabled={query.trim().length < 2}>
          Найти
        </Button>
      </form>

      <div className="flex max-h-[260px] flex-col gap-1.5 overflow-auto">
        {found.isFetching && <div className="py-4 text-center text-[13px] text-neutral-400">Ищем профили…</div>}
        {found.error && <div className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600">{found.error.message}</div>}
        {found.data && !candidates.length && !found.isFetching && (
          <div className="rounded-xl border border-dashed border-neutral-200 p-4 text-center text-[13px] text-neutral-500">
            Профилей без аккаунта не найдено. Попробуйте ФИО или другой контакт.
          </div>
        )}
        {candidates.map((p) => {
          const on = picked?.id === p.id && picked.profileType === p.profileType;
          return (
            <button
              key={`${p.profileType}-${p.id}`}
              onClick={() => setPicked(p)}
              className={cn("flex items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left", on ? "border-brand bg-brand-50" : "border-neutral-200 bg-white hover:bg-neutral-50")}
            >
              <Icon name="user" size={18} className="text-neutral-500" />
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-medium">{p.fullName}</div>
                <div className="text-[11px] text-neutral-400">
                  {profileTypeLabel[p.profileType]} · {p.organization.name}
                  {(p.phone || p.email) && ` · ${p.phone || p.email}`}
                </div>
              </div>
              {on && <Icon name="check" size={16} className="text-brand" />}
            </button>
          );
        })}
      </div>

      {picked && (
        <Callout tone="warn">
          После привязки <b>{picked.fullName}</b> получит доступ к данным {picked.organization.name} под логином <b>{account.username}</b> с ролью по умолчанию для
          типа «{profileTypeLabel[picked.profileType]}». <b>Пароль не меняется.</b>
        </Callout>
      )}
      {link.error && <div className="rounded-xl bg-red-50 px-3.5 py-2.5 text-xs text-red-600">{link.error.message}</div>}

      <ModalActions>
        <Button size="xl" onClick={onClose}>
          Отмена
        </Button>
        <Button
          size="xl"
          variant="primary"
          disabled={!picked || link.isPending}
          onClick={() => picked && link.mutate(picked, { onSuccess: onClose })}
        >
          {link.isPending ? "Привязываем…" : "Привязать профиль"}
        </Button>
      </ModalActions>
    </Modal>
  );
}
