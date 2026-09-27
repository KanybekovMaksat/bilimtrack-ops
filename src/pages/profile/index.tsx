import { useRef, useState } from "react";
import { PERMISSION_ICON, usePermissionCatalog, useUpdateMyProfile } from "@/entities/operator";
import { useSession } from "@/entities/session";
import { Button, Card, Field, Icon, PageHeader, TextInput, UserAvatar } from "@/shared/ui";

/** The signed-in admin edits own name and avatar. Privileges are granted in «Команда». */
export function ProfilePage() {
  const user = useSession((s) => s.user);
  const catalog = usePermissionCatalog();
  const { names, avatar } = useUpdateMyProfile();
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    lastName: user?.lastName ?? "",
    firstName: user?.firstName ?? "",
    middleName: user?.middleName ?? "",
  });
  const [saved, setSaved] = useState(false);
  if (!user) return null;
  const dirty = form.lastName !== user.lastName || form.firstName !== user.firstName || form.middleName !== user.middleName;

  return (
    <div className="flex max-w-[880px] flex-col gap-4">
      <PageHeader title="Мой профиль" subtitle="как вас видит команда: задачи, комментарии, аудит" />
      <Card className="flex items-center gap-5 p-5">
        <UserAvatar src={user.avatar} initials={user.initials} size={84} className="text-2xl" />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="text-lg font-semibold">{user.fullName || user.username}</div>
          <div className="font-num text-xs text-neutral-500">
            {user.username} · {user.role}
          </div>
          <div className="mt-2 flex gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) avatar.mutate(file);
                e.target.value = "";
              }}
            />
            <Button size="md" icon="camera" disabled={avatar.isPending} onClick={() => fileRef.current?.click()}>
              {avatar.isPending ? "Загружаем…" : user.avatar ? "Сменить фото" : "Загрузить фото"}
            </Button>
            {user.avatar && (
              <Button size="md" variant="ghost" icon="trash" disabled={avatar.isPending} onClick={() => avatar.mutate(null)}>
                Убрать
              </Button>
            )}
          </div>
          {avatar.error && <div className="text-xs text-red-600">{avatar.error.message}</div>}
        </div>
      </Card>

      <Card className="flex flex-col gap-3.5 p-5">
        <div className="text-sm font-medium">ФИО</div>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Фамилия" strong>
            <TextInput look="plain" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
          </Field>
          <Field label="Имя" strong>
            <TextInput look="plain" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
          </Field>
          <Field label="Отчество" strong>
            <TextInput look="plain" value={form.middleName} onChange={(e) => setForm({ ...form, middleName: e.target.value })} />
          </Field>
        </div>
        {names.error && <div className="rounded-xl bg-red-50 px-3.5 py-2.5 text-xs text-red-600">{names.error.message}</div>}
        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            disabled={!dirty || !form.firstName.trim() || names.isPending}
            onClick={() => names.mutate(form, { onSuccess: () => setSaved(true) })}
          >
            {names.isPending ? "Сохраняем…" : "Сохранить"}
          </Button>
          {saved && !dirty && (
            <span className="flex items-center gap-1 text-xs text-green-600">
              <Icon name="check" size={14} /> Сохранено
            </span>
          )}
        </div>
      </Card>

      <Card className="flex flex-col gap-2.5 p-5">
        <div className="text-sm font-medium">Мои привилегии</div>
        <div className="flex flex-wrap gap-1.5">
          {(catalog.data ?? []).map((p) => {
            const on = user.permissions.includes(p.code);
            return (
              <span
                key={p.code}
                className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs ${on ? "bg-brand-50 text-brand" : "bg-neutral-100 text-neutral-400 line-through"}`}
              >
                <Icon name={PERMISSION_ICON[p.code] ?? "key"} size={13} />
                {p.label}
              </span>
            );
          })}
        </div>
        <div className="text-xs text-neutral-400">Привилегии выдаёт администратор с доступом к разделу «Команда».</div>
      </Card>
    </div>
  );
}
