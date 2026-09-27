import { useRef, useState } from "react";
import {
  ORG_LOCALES,
  ORG_TIMEZONES,
  ORG_TYPES,
  orgMark,
  orgStatusLabel,
  useDeleteOrganization,
  useSetOrgLogo,
  useUpdateOrganization,
  type OrgCategory,
  type OrgStatus,
  type OrganizationDetail,
} from "@/entities/organization";
import { cn } from "@/shared/lib";
import { Button, Callout, Field, Icon, Modal, ModalActions, OrgMark, SelectInput, TextInput } from "@/shared/ui";

const Err = ({ error }: { error: Error | null }) =>
  error ? <div className="rounded-xl bg-red-50 px-3.5 py-2.5 text-xs text-red-600">{error.message}</div> : null;

/** Requisites, type, locale and category in one form. */
export function EditOrganizationModal({ org, onClose }: { org: OrganizationDetail; onClose: () => void }) {
  const update = useUpdateOrganization(org.id);
  const [form, setForm] = useState({
    name: org.name,
    shortName: org.shortName,
    legalName: org.legalName,
    slug: org.slug,
    type: org.type,
    timezone: org.timezone,
    locale: org.locale,
    country: org.country,
    email: org.email,
    phone: org.phone,
    website: org.website,
    address: org.address,
    taxId: org.taxId,
    category: (org.category ?? "client") as OrgCategory,
  });
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));
  const changed = Object.fromEntries(
    Object.entries(form).filter(([k, v]) => v !== ((org as unknown as Record<string, unknown>)[k] ?? (k === "category" ? "client" : ""))),
  );
  const text = (label: string, key: keyof typeof form, props: Partial<Parameters<typeof TextInput>[0]> = {}) => (
    <Field label={label} strong>
      <TextInput look="plain" value={form[key]} onChange={(e) => set({ [key]: e.target.value })} {...props} />
    </Field>
  );

  return (
    <Modal open onClose={onClose} width={720} title={`Изменить · ${org.name}`}>
      <div className="grid grid-cols-2 gap-3">
        {text("Название", "name")}
        {text("Краткое название", "shortName")}
        {text("Юридическое название", "legalName")}
        {text("Слаг", "slug", { numeric: true })}
        <Field label="Тип" strong>
          <SelectInput value={form.type} onChange={(e) => set({ type: e.target.value })} options={ORG_TYPES} />
        </Field>
        <Field label="Категория" strong>
          <SelectInput
            value={form.category}
            onChange={(e) => set({ category: e.target.value as OrgCategory })}
            options={[
              { value: "client", label: "Клиент — в метриках" },
              { value: "beta", label: "Beta — вне основных метрик" },
            ]}
          />
        </Field>
        <Field label="Часовой пояс" strong>
          <SelectInput value={form.timezone} onChange={(e) => set({ timezone: e.target.value })} options={ORG_TIMEZONES} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Язык" strong>
            <SelectInput value={form.locale} onChange={(e) => set({ locale: e.target.value })} options={ORG_LOCALES} />
          </Field>
          {text("Страна", "country", { maxLength: 2 })}
        </div>
        {text("Почта", "email", { type: "email" })}
        {text("Телефон", "phone")}
        {text("Сайт", "website")}
        {text("ИНН", "taxId")}
      </div>
      {text("Адрес", "address")}
      {form.slug !== org.slug && (
        <Callout tone="warn" icon="alert-triangle" iconClassName="text-warn">
          Слаг — часть адресов организации. Старые ссылки со слагом «{org.slug}» перестанут работать.
        </Callout>
      )}
      <Err error={update.error} />
      <ModalActions>
        <Button size="xl" onClick={onClose}>
          Отмена
        </Button>
        <Button size="xl" variant="primary" disabled={!Object.keys(changed).length || !form.name.trim() || update.isPending} onClick={() => update.mutate(changed, { onSuccess: onClose })}>
          {update.isPending ? "Сохраняем…" : "Сохранить"}
        </Button>
      </ModalActions>
    </Modal>
  );
}

const STATUS_TEXT: Record<OrgStatus, { title: string; body: string; button: string; danger?: boolean }> = {
  active: { title: "Включить", body: "Организация снова станет активной: сотрудники и студенты смогут работать как обычно.", button: "Включить" },
  inactive: {
    title: "Отключить",
    body: "Статус станет «Неактивна»: организация пропадёт из активных клиентов. Данные сохраняются, включить можно в любой момент.",
    button: "Отключить",
    danger: true,
  },
  archived: {
    title: "Перевести в архив",
    body: "Организация уходит в архив — для ушедших клиентов. Данные сохраняются, вернуть можно, включив её снова.",
    button: "В архив",
    danger: true,
  },
};

/** Switch between active / inactive (disabled) / archived. */
export function OrgStatusModal({ org, target, onClose }: { org: OrganizationDetail; target: OrgStatus; onClose: () => void }) {
  const update = useUpdateOrganization(org.id);
  const t = STATUS_TEXT[target];
  return (
    <Modal open onClose={onClose} width={500} title={`${t.title} «${org.name}»?`}>
      <div className="text-[13px] leading-5 text-neutral-700">{t.body}</div>
      <div className="text-xs text-neutral-500">
        Сейчас: {orgStatusLabel[org.status]} → станет: {orgStatusLabel[target]}. Изменение запишется в аудит.
      </div>
      <Err error={update.error} />
      <ModalActions>
        <Button size="xl" onClick={onClose}>
          Отмена
        </Button>
        <Button size="xl" variant={t.danger ? "danger" : "primary"} disabled={update.isPending} onClick={() => update.mutate({ status: target }, { onSuccess: onClose })}>
          {t.button}
        </Button>
      </ModalActions>
    </Modal>
  );
}

/** Irreversible delete: the operator types the slug to confirm. */
export function DeleteOrganizationModal({ org, onClose, onDeleted }: { org: OrganizationDetail; onClose: () => void; onDeleted: () => void }) {
  const remove = useDeleteOrganization(org.id);
  const [confirm, setConfirm] = useState("");
  return (
    <Modal open onClose={onClose} width={540} title={`Удалить «${org.name}» навсегда?`}>
      <Callout tone="danger" icon="alert-triangle" iconClassName="text-red-600">
        Удалятся все данные организации: {org.learnersCount} учащихся, {org.employeesCount} сотрудников, {org.membersCount} доступов, расписание, журнал. Это
        нельзя отменить. Если клиент просто ушёл — переведите организацию в архив.
      </Callout>
      <Field label={`Введите слаг «${org.slug}» для подтверждения`} strong>
        <TextInput look="plain" numeric value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder={org.slug} autoFocus />
      </Field>
      <Err error={remove.error} />
      <ModalActions>
        <Button size="xl" onClick={onClose}>
          Отмена
        </Button>
        <Button size="xl" variant="danger" icon="trash" disabled={confirm.trim() !== org.slug || remove.isPending} onClick={() => remove.mutate(confirm.trim(), { onSuccess: onDeleted })}>
          {remove.isPending ? "Удаляем…" : "Удалить навсегда"}
        </Button>
      </ModalActions>
    </Modal>
  );
}

/** Organization mark / logo; click to upload a new logo. */
export function OrgLogoPicker({ org, size = 52 }: { org: OrganizationDetail; size?: number }) {
  const setLogo = useSetOrgLogo(org.id);
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="group relative shrink-0" title={setLogo.error?.message ?? "Сменить логотип"}>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) setLogo.mutate(file);
          e.target.value = "";
        }}
      />
      <button onClick={() => ref.current?.click()} className="relative block border-0 bg-transparent p-0" disabled={setLogo.isPending}>
        {org.logo ? (
          <img src={org.logo} alt="" className="rounded-[14px] object-cover" style={{ width: size, height: size }} />
        ) : (
          <OrgMark short={orgMark(org)} size={size} className="text-neutral-700" />
        )}
        <span
          className={cn(
            "absolute inset-0 flex items-center justify-center rounded-[14px] bg-black/45 text-white opacity-0 transition-opacity group-hover:opacity-100",
            setLogo.isPending && "opacity-100",
          )}
        >
          <Icon name={setLogo.isPending ? "refresh" : "camera"} size={18} className={setLogo.isPending ? "animate-spin" : undefined} />
        </span>
      </button>
      {org.logo && (
        <button
          onClick={() => setLogo.mutate(null)}
          title="Убрать логотип"
          className="absolute -top-1.5 -right-1.5 hidden size-5 items-center justify-center rounded-full border border-neutral-200 bg-white p-0 text-neutral-500 group-hover:flex"
        >
          <Icon name="x" size={12} />
        </button>
      )}
    </div>
  );
}
