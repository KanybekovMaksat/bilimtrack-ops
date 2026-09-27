import { useState } from "react";
import { useAddPerson, useOrgRoles, useUpdateMembership, type OrgMember, type OrganizationDetail, type PersonCreated, type PersonKind } from "@/entities/organization";
import { cn, toggleIn } from "@/shared/lib";
import { Button, Callout, ErrorNote, Field, Icon, type IconName, Modal, ModalActions, SecretValue, SelectInput, TextInput, ToggleChip } from "@/shared/ui";

const KINDS: { value: PersonKind; label: string; icon: IconName; desc: string }[] = [
  { value: "employee", label: "Сотрудник", icon: "user-shield", desc: "карточка, логин и роли (преподаватель, завуч, админ…)" },
  { value: "learner", label: "Студент", icon: "school", desc: "карточка студента и логин с ролью «Студент»" },
  { value: "existing", label: "Уже есть аккаунт", icon: "user-search", desc: "дать существующему логину доступ и роли" },
];

/**
 * One form instead of the organization admin's «карточка → выдать доступ → роли»:
 * POST ops/organizations/:id/people/ creates the profile, the login and the membership at once.
 */
export function AddPersonModal({ org, onClose }: { org: OrganizationDetail; onClose: () => void }) {
  const roles = useOrgRoles(org.id);
  const add = useAddPerson(org.id);
  const [kind, setKind] = useState<PersonKind>("employee");
  const [result, setResult] = useState<PersonCreated | null>(null);
  const [form, setForm] = useState({ lastName: "", firstName: "", middleName: "", positionTitle: "", email: "", phone: "", username: "", branchId: "" });
  const [roleIds, setRoleIds] = useState<number[]>([]);
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  const valid = kind === "existing" ? !!form.username.trim() : !!form.firstName.trim();
  const needsRoles = kind !== "learner";

  const submit = () =>
    add.mutate(
      {
        kind,
        lastName: form.lastName.trim(),
        firstName: form.firstName.trim(),
        middleName: form.middleName.trim(),
        positionTitle: form.positionTitle.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        username: form.username.trim(),
        roleIds: needsRoles && roleIds.length ? roleIds : undefined,
        branchId: form.branchId ? Number(form.branchId) : null,
      },
      { onSuccess: setResult },
    );

  if (result) {
    return (
      <Modal open onClose={onClose} width={520} title="Готово">
        <Callout tone="success" icon="circle-check">
          {result.fullName || result.username} получил(а) доступ в «{org.name}»{result.roles.length ? `: ${result.roles.join(", ")}` : ""}.
        </Callout>
        <SecretValue label="Логин" value={result.username} />
        {result.password ? (
          <>
            <SecretValue label="Временный пароль" value={result.password} />
            <div className="text-xs text-neutral-500">Пароль показывается один раз. При первом входе его попросят сменить.</div>
          </>
        ) : (
          <div className="text-xs text-neutral-500">Учётная запись уже была — пароль не менялся.</div>
        )}
        <ModalActions>
          <Button
            size="xl"
            onClick={() => {
              setResult(null);
              setForm({ lastName: "", firstName: "", middleName: "", positionTitle: "", email: "", phone: "", username: "", branchId: form.branchId });
            }}
          >
            Добавить ещё
          </Button>
          <Button size="xl" variant="primary" onClick={onClose}>
            Готово
          </Button>
        </ModalActions>
      </Modal>
    );
  }

  return (
    <Modal open onClose={onClose} width={680} title={`Добавить человека · ${org.name}`}>
      <div className="grid grid-cols-3 gap-2">
        {KINDS.map((k) => {
          const on = kind === k.value;
          return (
            <button key={k.value} onClick={() => setKind(k.value)} className={cn("flex flex-col gap-1 rounded-[14px] border p-3 text-left", on ? "border-brand bg-brand-50" : "border-neutral-200 bg-white")}>
              <Icon name={k.icon} size={19} className={on ? "text-brand" : "text-neutral-500"} />
              <span className={cn("text-[13px] font-medium", on && "text-brand")}>{k.label}</span>
              <span className="text-[11px] leading-[14px] text-neutral-500">{k.desc}</span>
            </button>
          );
        })}
      </div>

      {kind !== "existing" && (
        <div className="grid grid-cols-3 gap-3">
          <Field label="Фамилия" strong>
            <TextInput look="plain" value={form.lastName} onChange={(e) => set({ lastName: e.target.value })} autoFocus />
          </Field>
          <Field label="Имя · обязательно" strong>
            <TextInput look="plain" value={form.firstName} onChange={(e) => set({ firstName: e.target.value })} />
          </Field>
          <Field label="Отчество" strong>
            <TextInput look="plain" value={form.middleName} onChange={(e) => set({ middleName: e.target.value })} />
          </Field>
          {kind === "employee" && (
            <Field label="Должность" strong>
              <TextInput look="plain" value={form.positionTitle} onChange={(e) => set({ positionTitle: e.target.value })} placeholder="Преподаватель" />
            </Field>
          )}
          <Field label="Почта" strong>
            <TextInput look="plain" type="email" value={form.email} onChange={(e) => set({ email: e.target.value })} />
          </Field>
          <Field label="Телефон" strong>
            <TextInput look="plain" value={form.phone} onChange={(e) => set({ phone: e.target.value })} placeholder="+996…" />
          </Field>
          {kind === "employee" && (
            <Field label="Логин (пусто — придумаем)" strong>
              <TextInput look="plain" numeric value={form.username} onChange={(e) => set({ username: e.target.value.toLowerCase() })} />
            </Field>
          )}
          {kind === "employee" && org.branches.length > 0 && (
            <Field label="Филиал" strong>
              <SelectInput value={form.branchId} onChange={(e) => set({ branchId: e.target.value })} placeholder="Без филиала" options={org.branches.map((b) => ({ value: String(b.id), label: b.name }))} />
            </Field>
          )}
        </div>
      )}
      {kind === "existing" && (
        <Field label="Логин учётной записи" strong>
          <TextInput look="plain" numeric value={form.username} onChange={(e) => set({ username: e.target.value })} placeholder="логин из раздела «Аккаунты»" autoFocus />
        </Field>
      )}

      {needsRoles && (
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold text-neutral-500">Роли в организации {roleIds.length ? `· ${roleIds.length}` : "· по умолчанию «Преподаватель»"}</span>
          <div className="flex max-h-[150px] flex-wrap gap-1.5 overflow-auto">
            {(roles.data ?? []).map((r) => (
              <span key={r.id} title={r.description}>
                <ToggleChip on={roleIds.includes(r.id)} label={r.name} onClick={() => setRoleIds((ids) => toggleIn(ids, r.id))} />
              </span>
            ))}
            {roles.isLoading && <span className="text-xs text-neutral-400">Загружаем роли…</span>}
            {roles.error && <span className="text-xs text-red-600">{roles.error.message}</span>}
          </div>
        </div>
      )}

      <ErrorNote error={add.error} />
      <ModalActions>
        <Button size="xl" onClick={onClose}>
          Отмена
        </Button>
        <Button size="xl" variant="primary" icon="user-plus" disabled={!valid || add.isPending} onClick={submit}>
          {add.isPending ? "Создаём…" : kind === "existing" ? "Выдать доступ" : "Создать и выдать доступ"}
        </Button>
      </ModalActions>
    </Modal>
  );
}

/** Roles and active / suspended status of one membership. */
export function EditMembershipModal({ org, member, onClose }: { org: OrganizationDetail; member: OrgMember; onClose: () => void }) {
  const roles = useOrgRoles(org.id);
  const update = useUpdateMembership(org.id);
  const assignable = new Set((roles.data ?? []).map((r) => r.id));
  const [roleIds, setRoleIds] = useState<number[]>(member.roles.map((r) => r.id).filter((id) => assignable.has(id) || !roles.data));
  const [status, setStatus] = useState<"active" | "suspended">(member.status === "suspended" ? "suspended" : "active");
  const fixed = member.roles.filter((r) => roles.data && !assignable.has(r.id));

  return (
    <Modal open onClose={onClose} width={600} title={`Доступ · ${member.fullName || member.user.username}`}>
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold text-neutral-500">Роли</span>
        <div className="flex flex-wrap gap-1.5">
          {(roles.data ?? []).map((r) => (
            <ToggleChip key={r.id} on={roleIds.includes(r.id)} label={r.name} onClick={() => setRoleIds((ids) => toggleIn(ids, r.id))} />
          ))}
        </div>
        {fixed.length > 0 && <div className="text-xs text-neutral-500">Не меняются здесь: {fixed.map((r) => r.name).join(", ")} (владелец, студент, родитель).</div>}
      </div>
      <div className="flex gap-1.5">
        <Button size="sm" variant={status === "active" ? "primary" : "outline"} onClick={() => setStatus("active")}>
          Доступ активен
        </Button>
        <Button size="sm" variant={status === "suspended" ? "danger" : "outline"} disabled={member.isOwner} onClick={() => setStatus("suspended")}>
          Приостановить
        </Button>
      </div>
      <ErrorNote error={update.error} />
      <ModalActions>
        <Button size="xl" onClick={onClose}>
          Отмена
        </Button>
        <Button size="xl" variant="primary" disabled={update.isPending || !roles.data} onClick={() => update.mutate({ membershipId: member.id, roleIds: roleIds.filter((id) => assignable.has(id)), status }, { onSuccess: onClose })}>
          {update.isPending ? "Сохраняем…" : "Сохранить"}
        </Button>
      </ModalActions>
    </Modal>
  );
}
