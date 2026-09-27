import { useState } from "react";
import { PERMISSION_ICON, useCreateOperator, usePermissionCatalog, useResetOperatorPassword, useUpdateOperator, type Operator } from "@/entities/operator";
import { useSession } from "@/entities/session";
import { cn, toggleIn } from "@/shared/lib";
import { Button, Callout, CheckBox, ErrorNote, Field, Icon, Modal, ModalActions, SecretValue, TextInput, Toggle } from "@/shared/ui";

type Props = { operator: Operator | null; onClose: () => void };

/** Create a platform admin (`operator = null`) or edit one: names, e-mail, privileges, access. */
export function OperatorFormModal({ operator, onClose }: Props) {
  const me = useSession((s) => s.user);
  const catalog = usePermissionCatalog();
  const create = useCreateOperator();
  const update = useUpdateOperator();
  const [created, setCreated] = useState<{ username: string; password: string } | null>(null);
  const [form, setForm] = useState({
    username: operator?.username ?? "",
    email: operator?.email ?? "",
    lastName: operator?.lastName ?? "",
    firstName: operator?.firstName ?? "",
    middleName: operator?.middleName ?? "",
    permissions: operator?.permissions ?? ["support", "tasks"],
    isActive: operator?.isActive ?? true,
  });
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));
  const self = operator?.id === me?.id;
  const pending = create.isPending || update.isPending;
  const error = create.error ?? update.error;
  const valid = form.firstName.trim() && (operator || /^[a-z0-9][a-z0-9._-]{2,}$/.test(form.username.trim()));
  const all = catalog.data?.map((p) => p.code) ?? [];

  const save = () => {
    const common = {
      email: form.email.trim(),
      lastName: form.lastName.trim(),
      firstName: form.firstName.trim(),
      middleName: form.middleName.trim(),
      permissions: form.permissions,
    };
    if (operator) update.mutate({ id: operator.id, ...common, isActive: form.isActive }, { onSuccess: onClose });
    else
      create.mutate(
        { ...common, username: form.username.trim().toLowerCase() },
        { onSuccess: (res) => setCreated({ username: res.operator.username, password: res.temporaryPassword }) },
      );
  };

  if (created) {
    return (
      <Modal open onClose={onClose} width={520} title="Администратор создан">
        <Callout tone="success" icon="circle-check">
          Передайте данные для входа лично. Пароль временный: при первом входе в Ops его попросят сменить. Больше он нигде не покажется.
        </Callout>
        <SecretValue label="Логин" value={created.username} />
        <SecretValue label="Временный пароль" value={created.password} />
        <ModalActions>
          <Button size="xl" variant="primary" onClick={onClose}>
            Готово
          </Button>
        </ModalActions>
      </Modal>
    );
  }

  return (
    <Modal open onClose={onClose} width={640} title={operator ? `Администратор · ${operator.fullName}` : "Новый администратор платформы"}>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Фамилия" strong>
          <TextInput look="plain" value={form.lastName} onChange={(e) => set({ lastName: e.target.value })} />
        </Field>
        <Field label="Имя · обязательно" strong>
          <TextInput look="plain" value={form.firstName} onChange={(e) => set({ firstName: e.target.value })} autoFocus={!operator} />
        </Field>
        <Field label="Отчество" strong>
          <TextInput look="plain" value={form.middleName} onChange={(e) => set({ middleName: e.target.value })} />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label={operator ? "Логин" : "Логин · латиница, от 3 символов"} strong>
          <TextInput
            look="plain"
            numeric
            value={form.username}
            disabled={!!operator}
            placeholder="a.surname"
            onChange={(e) => set({ username: e.target.value.toLowerCase() })}
          />
        </Field>
        <Field label="Почта" strong>
          <TextInput look="plain" type="email" value={form.email} onChange={(e) => set({ email: e.target.value })} placeholder="name@bilimtrack.kg" />
        </Field>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="flex-1 text-xs font-semibold text-neutral-500">Привилегии · {form.permissions.length} из {all.length || "…"}</span>
          <button type="button" className="border-0 bg-transparent p-0 text-xs text-brand" onClick={() => set({ permissions: all })}>
            Все
          </button>
          <button type="button" className="border-0 bg-transparent p-0 text-xs text-neutral-500" onClick={() => set({ permissions: self ? ["team"] : [] })}>
            Сбросить
          </button>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {(catalog.data ?? []).map((p) => {
            const on = form.permissions.includes(p.code);
            const locked = self && p.code === "team";
            return (
              <button
                key={p.code}
                type="button"
                disabled={locked}
                title={locked ? "Себе привилегию «Команда» не снять" : undefined}
                onClick={() => setForm((f) => ({ ...f, permissions: toggleIn(f.permissions, p.code) }))}
                className={cn(
                  "flex items-center gap-2.5 rounded-xl border px-3 py-2 text-left text-[13px] disabled:opacity-60",
                  on ? "border-brand bg-brand-50" : "border-neutral-200 bg-white",
                )}
              >
                <CheckBox on={on} />
                <Icon name={PERMISSION_ICON[p.code] ?? "key"} size={16} className={on ? "text-brand" : "text-neutral-400"} />
                <span className="min-w-0 flex-1 leading-[17px]">{p.label}</span>
              </button>
            );
          })}
          {catalog.isLoading && <div className="col-span-2 h-24 animate-pulse rounded-xl bg-neutral-50" />}
          {catalog.error && <div className="col-span-2 text-xs text-red-600">Не удалось загрузить привилегии: {catalog.error.message}</div>}
        </div>
      </div>

      {operator && (
        <div className="flex items-center gap-2.5 rounded-xl bg-neutral-50 px-3.5 py-2.5">
          <Toggle on={form.isActive} disabled={self} label="Доступ открыт" onChange={(isActive) => set({ isActive })} />
          <span className="flex-1 text-[13px]">{form.isActive ? "Доступ в Ops открыт" : "Доступ закрыт — войти в Ops нельзя"}</span>
          {self && <span className="text-[11px] text-neutral-400">себя отключить нельзя</span>}
        </div>
      )}
      {!operator && (
        <div className="text-xs leading-[18px] text-neutral-500">
          Пароль сгенерируется автоматически и покажется один раз. У администратора нет членства в организациях — он работает поверх всех клиентов.
        </div>
      )}
      <ErrorNote error={error} />
      <ModalActions>
        <Button size="xl" onClick={onClose}>
          Отмена
        </Button>
        <Button size="xl" variant="primary" disabled={!valid || pending} onClick={save}>
          {pending ? "Сохраняем…" : operator ? "Сохранить" : "Создать администратора"}
        </Button>
      </ModalActions>
    </Modal>
  );
}

/** Issue a fresh temporary password and show it once. */
export function ResetPasswordModal({ operator, onClose }: { operator: Operator; onClose: () => void }) {
  const reset = useResetOperatorPassword();
  return (
    <Modal open onClose={onClose} width={500} title={`Новый временный пароль · ${operator.fullName}`}>
      {reset.data ? (
        <>
          <Callout tone="success" icon="circle-check">
            Старый пароль больше не действует. При входе администратора попросят задать свой.
          </Callout>
          <SecretValue label="Логин" value={operator.username} />
          <SecretValue label="Временный пароль" value={reset.data.temporaryPassword} />
        </>
      ) : (
        <div className="text-[13px] leading-5 text-neutral-700">
          Текущий пароль {operator.username} перестанет работать сразу. Действие попадёт в аудит.
        </div>
      )}
      <ErrorNote error={reset.error} />
      <ModalActions>
        <Button size="xl" onClick={onClose}>
          {reset.data ? "Готово" : "Отмена"}
        </Button>
        {!reset.data && (
          <Button size="xl" variant="danger" disabled={reset.isPending} onClick={() => reset.mutate(operator.id)}>
            Выдать новый пароль
          </Button>
        )}
      </ModalActions>
    </Modal>
  );
}
