import { useState } from "react";
import { accountName, useAccounts } from "@/entities/account";
import { useGrantDays, useRevokeAccess, type PersonRef } from "@/entities/subscription";
import { cn, formatDateLong, useDebouncedEffect } from "@/shared/lib";
import { Button, Callout, ErrorNote, Field, KV, Modal, ModalActions, TextArea, TextInput } from "@/shared/ui";

const PRESETS = [7, 30, 180, 365];

/** Picks an account by login/name when the grant starts from the list, not from a subscription. */
function AccountPicker({ value, onChange }: { value: PersonRef | null; onChange: (p: PersonRef) => void }) {
  const [query, setQuery] = useState("");
  const [q, setQ] = useState("");
  useDebouncedEffect(query.trim(), 300, setQ);
  const found = useAccounts({ q: q.length >= 2 ? q : undefined, page: 1 });
  const rows = q.length >= 2 ? (found.data?.rows ?? []).slice(0, 6) : [];

  return (
    <Field label="Кому">
      <TextInput inputSize="md" placeholder="Логин, почта или ФИО — от 2 символов" value={query} onChange={(e) => setQuery(e.target.value)} />
      <div className="mt-1.5 flex flex-col gap-1">
        {rows.map((a) => {
          const person = { id: a.id, username: a.username, fullName: accountName(a) || a.username };
          const on = value?.id === a.id;
          return (
            <button
              key={a.id}
              type="button"
              onClick={() => onChange(person)}
              className={cn("flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left text-[13px]", on ? "border-brand bg-brand-50" : "border-neutral-100 hover:border-neutral-300")}
            >
              <span className="font-num">{a.username}</span>
              <span className="truncate text-neutral-500">{accountName(a)}</span>
            </button>
          );
        })}
        {q.length >= 2 && found.data && !rows.length && <span className="text-xs text-neutral-400">Никого не нашли</span>}
      </div>
    </Field>
  );
}

/** Manual Bilimtrack+ days (POST ops/billing/subscriptions/grant/): compensation, partners, tests. */
export function GrantDaysModal({ user, accessUntil, onClose }: { user?: PersonRef; accessUntil?: string | null; onClose: () => void }) {
  const [person, setPerson] = useState<PersonRef | null>(user ?? null);
  const [days, setDays] = useState("30");
  const [comment, setComment] = useState("");
  const grant = useGrantDays();
  const n = Number(days);
  const valid = person !== null && Number.isInteger(n) && n >= 1 && n <= 3650 && comment.trim().length > 0;

  return (
    <Modal open onClose={onClose} title="Выдать дни Bilimtrack+">
      {user ? (
        <div className="flex flex-col gap-[9px]">
          <KV k="Кому" width={150}>
            {user.fullName} · <span className="font-num">{user.username}</span>
          </KV>
          <KV k="Сейчас доступ до" width={150}>
            {formatDateLong(accessUntil ?? null, "нет доступа")}
          </KV>
        </div>
      ) : (
        <AccountPicker value={person} onChange={setPerson} />
      )}
      <Field label="Сколько дней">
        <div className="flex items-center gap-2">
          <TextInput inputSize="md" numeric className="w-24" value={days} onChange={(e) => setDays(e.target.value.replace(/\D/g, ""))} />
          {PRESETS.map((p) => (
            <Button key={p} size="sm" variant={n === p ? "primary" : "outline"} onClick={() => setDays(String(p))}>
              {p}
            </Button>
          ))}
        </div>
      </Field>
      <Field label="Причина — обязательно, попадёт в аудит">
        <TextArea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Компенсация за сбой оплаты 29.09" />
      </Field>
      <Callout tone="info">Дни добавляются в конец текущего доступа — оплаченные дни не сгорают.</Callout>
      <ErrorNote error={grant.error} />
      <ModalActions>
        <Button size="xl" onClick={onClose}>
          Отмена
        </Button>
        <Button
          size="xl"
          variant="primary"
          disabled={!valid || grant.isPending}
          onClick={() => person && grant.mutate({ userId: person.id, days: n, comment: comment.trim() }, { onSuccess: onClose })}
        >
          {grant.isPending ? "Выдаём…" : `Выдать ${Number.isInteger(n) && n > 0 ? n : ""} дн.`}
        </Button>
      </ModalActions>
    </Modal>
  );
}

/** Closes access now (POST ops/billing/subscriptions/:userId/revoke/). Money is not returned. */
export function RevokeAccessModal({ user, accessUntil, onClose }: { user: PersonRef; accessUntil: string | null; onClose: () => void }) {
  const [comment, setComment] = useState("");
  const revoke = useRevokeAccess(user.id);

  return (
    <Modal open onClose={onClose} title={`Закрыть доступ ${user.username}?`}>
      <div className="flex flex-col gap-[9px]">
        <KV k="Кому" width={150}>
          {user.fullName}
        </KV>
        <KV k="Доступ до" width={150}>
          {formatDateLong(accessUntil)}
        </KV>
      </div>
      <Field label="Причина — обязательно, попадёт в аудит">
        <TextArea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Ошибочная выдача" />
      </Field>
      <Callout tone="danger">Все неистёкшие периоды отзываются сразу. Деньги это не возвращает — оплату отмечают возвратом в «Платежах».</Callout>
      <ErrorNote error={revoke.error} />
      <ModalActions>
        <Button size="xl" onClick={onClose}>
          Отмена
        </Button>
        <Button size="xl" variant="danger" disabled={!comment.trim() || revoke.isPending} onClick={() => revoke.mutate(comment.trim(), { onSuccess: onClose })}>
          {revoke.isPending ? "Закрываем…" : "Закрыть доступ"}
        </Button>
      </ModalActions>
    </Modal>
  );
}
