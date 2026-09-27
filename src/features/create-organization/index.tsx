import { Fragment, useState } from "react";
import { useLicenseCatalog } from "@/entities/license";
import { ORG_LOCALES, ORG_TIMEZONES, useCreateOrganization, type Credentials, type OrgCategory, type OwnerInput } from "@/entities/organization";
import { cn } from "@/shared/lib";
import { Button, Callout, Card, ErrorNote, Field, Icon, type IconName, KV, SecretValue, SelectInput, TextInput } from "@/shared/ui";

const STEPS = ["Основные данные", "Категория и лицензия", "Первый филиал", "Владелец", "Проверка и создание"];

const TYPES: { value: string; label: string; icon: IconName; desc: string }[] = [
  { value: "school", label: "Школа", icon: "school", desc: "четверти, классы, табели" },
  { value: "college", label: "Колледж", icon: "building-community", desc: "семестры, группы, практика" },
  { value: "university", label: "Университет", icon: "building-bank", desc: "кредиты, GPA, факультеты" },
  { value: "course_center", label: "Учебный центр", icon: "book", desc: "курсы и потоки" },
  { value: "tutor", label: "Репетитор", icon: "user", desc: "один преподаватель" },
];

const translit: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z", и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", ң: "n", о: "o", ө: "o",
  п: "p", р: "r", с: "s", т: "t", у: "u", ү: "u", ф: "f", х: "h", ц: "c", ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
};
const slugify = (s: string) =>
  s
    .toLowerCase()
    .split("")
    .map((ch) => translit[ch] ?? ch)
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);

type Created = { id: number; name: string; credentials: Credentials | null };
type Props = { onDone: (id: number) => void };

/** Five-step wizard; everything is sent in one POST ops/organizations/ at the end. */
export function CreateOrganizationWizard({ onDone }: Props) {
  const catalog = useLicenseCatalog();
  const create = useCreateOrganization();
  const [step, setStep] = useState(1);
  const [created, setCreated] = useState<Created | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);
  const [form, setForm] = useState({
    name: "",
    shortName: "",
    legalName: "",
    slug: "",
    type: "college",
    timezone: "Asia/Bishkek",
    locale: "ru",
    country: "KG",
    email: "",
    phone: "",
    website: "",
    address: "",
    taxId: "",
    category: "client" as OrgCategory,
    plan: "base" as string,
    branchName: "Главный корпус",
    branchAddress: "",
  });
  const [owner, setOwner] = useState<OwnerInput>({ mode: "new", username: "", email: "", lastName: "", firstName: "", middleName: "", positionTitle: "Директор" });
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));
  const setO = (patch: Partial<OwnerInput>) => setOwner((o) => ({ ...o, ...patch }));

  const plan = catalog.plans.find((p) => p.code === form.plan);
  const moduleName = (code: string) => catalog.modules.find((m) => m.code === code)?.name ?? code;
  const stepValid: Record<number, boolean> = {
    1: form.name.trim().length > 1 && (!form.slug || /^[a-z0-9-]+$/.test(form.slug)),
    2: true,
    3: true,
    4:
      owner.mode === "none" ||
      (owner.mode === "existing" && !!owner.username?.trim()) ||
      (owner.mode === "new" && /^[a-z0-9][a-z0-9._-]{2,}$/.test(owner.username?.trim() ?? "") && !!owner.firstName?.trim()),
    5: true,
  };
  const canSubmit = [1, 4].every((s) => stepValid[s]);

  const submit = () =>
    create.mutate(
      {
        ...form,
        slug: form.slug || undefined,
        plan: form.plan || null,
        applyPlanModules: true,
        branchName: form.branchName.trim(),
        owner: owner.mode === "none" ? { mode: "none" } : { ...owner, username: owner.username?.trim().toLowerCase() },
      },
      { onSuccess: (org) => setCreated({ id: org.id, name: org.name, credentials: org.ownerCredentials ?? null }) },
    );

  if (created) {
    return (
      <Card className="flex flex-col gap-4 p-[22px]">
        <Callout tone="success" icon="circle-check">
          Организация «{created.name}» создана: филиал, модули пакета и владелец готовы. Действие записано в аудит.
        </Callout>
        {created.credentials && (
          <div className="flex flex-col gap-2">
            <div className="text-[13px] font-medium">Доступ владельца — показывается один раз</div>
            <SecretValue label="Логин" value={created.credentials.username} />
            <SecretValue label="Временный пароль" value={created.credentials.password} />
            <div className="text-xs text-neutral-500">При первом входе владельца попросят сменить пароль.</div>
          </div>
        )}
        <div className="flex gap-2">
          <Button size="xl" variant="primary" iconRight="arrow-up-right" onClick={() => onDone(created.id)}>
            Открыть карточку
          </Button>
        </div>
      </Card>
    );
  }

  const input = (label: string, key: keyof typeof form, props: Partial<Parameters<typeof TextInput>[0]> = {}) => (
    <Field key={key} label={label} strong>
      <TextInput look="plain" value={form[key]} onChange={(e) => set({ [key]: e.target.value })} {...props} />
    </Field>
  );

  return (
    <>
      <div className="flex items-center">
        {STEPS.map((label, i) => {
          const n = i + 1;
          const done = n < step;
          const cur = n === step;
          return (
            <button key={label} onClick={() => setStep(n)} className="flex flex-1 items-center gap-2 border-0 bg-transparent p-0 text-left">
              <span
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                  done ? "border-transparent bg-green-500 text-white" : cur ? "border-transparent bg-brand text-white" : "border-neutral-200 bg-white text-neutral-400",
                )}
              >
                {done ? <Icon name="check" size={13} /> : n}
              </span>
              <span className={cn("text-xs leading-4", cur ? "font-semibold text-ink" : "text-neutral-500")}>{label}</span>
              <span className="h-px min-w-3 flex-1 bg-neutral-200" />
            </button>
          );
        })}
      </div>

      <Card className="flex flex-col gap-4 p-[22px]">
        {step === 1 && (
          <div className="flex flex-col gap-3.5">
            <div className="text-base font-semibold">Основные данные</div>
            <Field label="Название организации · обязательно" strong>
              <TextInput
                look="plain"
                autoFocus
                value={form.name}
                placeholder="Колледж «Алатау»"
                onChange={(e) => set({ name: e.target.value, ...(slugTouched ? {} : { slug: slugify(form.shortName || e.target.value) }) })}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              {input("Краткое название", "shortName", {
                onChange: (e) => set({ shortName: e.target.value, ...(slugTouched ? {} : { slug: slugify(e.target.value || form.name) }) }),
              })}
              {input("Юридическое название", "legalName", { placeholder: "ОсОО «…»" })}
              <Field label="Слаг (адрес в системе)" strong>
                <TextInput
                  look="plain"
                  numeric
                  value={form.slug}
                  placeholder="alatau"
                  onChange={(e) => {
                    setSlugTouched(true);
                    set({ slug: e.target.value.toLowerCase() });
                  }}
                />
              </Field>
              {input("ИНН", "taxId")}
            </div>
            <div className="text-xs font-semibold text-neutral-500">Тип заведения</div>
            <div className="grid grid-cols-5 gap-2">
              {TYPES.map((t) => {
                const on = form.type === t.value;
                return (
                  <button
                    key={t.value}
                    onClick={() => set({ type: t.value })}
                    className={cn("flex flex-col gap-1.5 rounded-[14px] border p-3 text-left", on ? "border-brand bg-brand-50" : "border-neutral-200 bg-white")}
                  >
                    <Icon name={t.icon} size={20} className={on ? "text-brand" : "text-ink"} />
                    <div className={cn("text-[13px] font-medium", on ? "text-brand" : "text-ink")}>{t.label}</div>
                    <div className="text-[11px] leading-[14px] text-neutral-500">{t.desc}</div>
                  </button>
                );
              })}
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Часовой пояс" strong>
                <SelectInput value={form.timezone} onChange={(e) => set({ timezone: e.target.value })} options={ORG_TIMEZONES} />
              </Field>
              <Field label="Язык" strong>
                <SelectInput value={form.locale} onChange={(e) => set({ locale: e.target.value })} options={ORG_LOCALES} />
              </Field>
              {input("Страна (ISO, 2 буквы)", "country", { maxLength: 2 })}
              {input("Почта", "email", { type: "email" })}
              {input("Телефон", "phone")}
              {input("Сайт", "website", { placeholder: "https://" })}
            </div>
            {input("Адрес", "address")}
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-3.5">
            <div className="text-base font-semibold">Категория и лицензия</div>
            <div className="grid grid-cols-2 gap-2.5">
              {(
                [
                  ["client", "Клиент", "Учитывается во всех метриках главной страницы", "building"],
                  ["beta", "Beta", "Тестовая или пилотная площадка — в основные метрики не попадает", "flask"],
                ] as [OrgCategory, string, string, IconName][]
              ).map(([value, label, desc, icon]) => {
                const on = form.category === value;
                return (
                  <button
                    key={value}
                    onClick={() => set({ category: value })}
                    className={cn("flex items-start gap-3 rounded-[14px] border p-3.5 text-left", on ? "border-brand bg-brand-50" : "border-neutral-200 bg-white")}
                  >
                    <Icon name={icon} size={20} className={on ? "text-brand" : "text-neutral-500"} />
                    <span>
                      <span className={cn("block text-sm font-medium", on && "text-brand")}>{label}</span>
                      <span className="block text-xs text-neutral-500">{desc}</span>
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="text-xs font-semibold text-neutral-500">Пакет лицензии — включит модули пакета</div>
            <div className="grid grid-cols-3 gap-2">
              {[...catalog.plans, { code: "", label: "Без договора", description: "Модули по умолчанию, лицензию можно записать позже", modules: [], organizationsCount: 0 }].map((p) => {
                const on = form.plan === p.code;
                return (
                  <button
                    key={p.code || "none"}
                    onClick={() => set({ plan: p.code })}
                    className={cn("flex flex-col gap-1 rounded-[14px] border p-3 text-left", on ? "border-brand bg-brand-50" : "border-neutral-200 bg-white")}
                  >
                    <span className={cn("text-[13px] font-medium", on && "text-brand")}>{p.label}</span>
                    <span className="text-[11px] leading-[15px] text-neutral-500">{p.description}</span>
                  </button>
                );
              })}
            </div>
            {plan && plan.modules.length > 0 && (
              <div className="flex flex-wrap gap-1.5 rounded-[14px] border border-neutral-200 p-3.5">
                {catalog.modules.map((m) => {
                  const on = plan.modules.includes(m.code);
                  return (
                    <span key={m.code} className={cn("inline-flex items-center gap-[5px] rounded-full px-[11px] py-1 text-xs", on ? "bg-green-50 text-green-600" : "bg-neutral-100 text-neutral-400")}>
                      <Icon name={on ? "check" : "x"} size={13} />
                      {m.name}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-3.5">
            <div className="text-base font-semibold">Первый филиал</div>
            <div className="text-[13px] text-neutral-500">К филиалу привязываются группы и расписание. Пустое название — филиал не создаётся.</div>
            {input("Название филиала", "branchName")}
            {input("Адрес филиала", "branchAddress", { placeholder: form.address || "г. Бишкек, …" })}
          </div>
        )}

        {step === 4 && (
          <div className="flex flex-col gap-3.5">
            <div className="text-base font-semibold">Владелец аккаунта</div>
            <div className="flex gap-1.5">
              {(
                [
                  ["new", "Новая учётная запись"],
                  ["existing", "Существующий логин"],
                  ["none", "Назначить позже"],
                ] as [OwnerInput["mode"], string][]
              ).map(([mode, label]) => (
                <Button key={mode} size="sm" variant={owner.mode === mode ? "primary" : "outline"} onClick={() => setO({ mode })}>
                  {label}
                </Button>
              ))}
            </div>
            {owner.mode === "new" && (
              <>
                <div className="grid grid-cols-3 gap-3">
                  <Field label="Фамилия" strong>
                    <TextInput look="plain" value={owner.lastName} onChange={(e) => setO({ lastName: e.target.value })} />
                  </Field>
                  <Field label="Имя · обязательно" strong>
                    <TextInput look="plain" value={owner.firstName} onChange={(e) => setO({ firstName: e.target.value })} />
                  </Field>
                  <Field label="Отчество" strong>
                    <TextInput look="plain" value={owner.middleName} onChange={(e) => setO({ middleName: e.target.value })} />
                  </Field>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <Field label="Логин · латиница" strong>
                    <TextInput look="plain" numeric value={owner.username} placeholder="b.zhunusov" onChange={(e) => setO({ username: e.target.value.toLowerCase() })} />
                  </Field>
                  <Field label="Почта" strong>
                    <TextInput look="plain" type="email" value={owner.email} onChange={(e) => setO({ email: e.target.value })} />
                  </Field>
                  <Field label="Должность" strong>
                    <TextInput look="plain" value={owner.positionTitle} onChange={(e) => setO({ positionTitle: e.target.value })} />
                  </Field>
                </div>
                <Callout tone="muted" className="text-neutral-700">
                  Владелец получит роль «Владелец» и карточку сотрудника. Временный пароль покажем один раз после создания — при первом входе его попросят сменить.
                </Callout>
              </>
            )}
            {owner.mode === "existing" && (
              <Field label="Логин существующей учётной записи" strong>
                <TextInput look="plain" numeric value={owner.username} onChange={(e) => setO({ username: e.target.value })} placeholder="логин из раздела «Аккаунты»" />
              </Field>
            )}
            {owner.mode === "none" && <div className="text-[13px] text-neutral-500">Организация создастся без владельца. Людей можно добавить во вкладке «Люди» карточки.</div>}
          </div>
        )}

        {step === 5 && (
          <div className="flex flex-col gap-3.5">
            <div className="text-base font-semibold">Проверка и создание</div>
            {(
              [
                ["Организация", `${form.name || "—"} · ${form.slug || "слаг сгенерируется"}`, 1],
                ["Тип", TYPES.find((t) => t.value === form.type)?.label ?? form.type, 1],
                ["Категория", form.category === "beta" ? "Beta — вне основных метрик" : "Клиент", 2],
                ["Лицензия", plan ? `${plan.label}: ${plan.modules.map(moduleName).join(", ") || "состав вручную"}` : "Без договора", 2],
                ["Первый филиал", form.branchName.trim() || "не создаётся", 3],
                [
                  "Владелец",
                  owner.mode === "new"
                    ? `${[owner.lastName, owner.firstName].filter(Boolean).join(" ")} · ${owner.username} (новый)`
                    : owner.mode === "existing"
                      ? `${owner.username} (существующий)`
                      : "позже",
                  4,
                ],
              ] as [string, string, number][]
            ).map(([k, v, target]) => (
              <Fragment key={k}>
                <div className="flex gap-3 border-b border-neutral-50 pb-2.5">
                  <KV k={k} width={170} className="flex-1">
                    {v}
                  </KV>
                  <button onClick={() => setStep(target)} className="border-0 bg-transparent p-0 text-xs text-brand">
                    Изменить
                  </button>
                </div>
              </Fragment>
            ))}
            {!canSubmit && <Callout tone="warn">Заполните обязательные поля на шагах «Основные данные» и «Владелец».</Callout>}
            <ErrorNote error={create.error} />
          </div>
        )}

        <div className="flex gap-2 border-t border-neutral-100 pt-4">
          <Button size="xl" disabled={step === 1} onClick={() => setStep((s) => Math.max(1, s - 1))}>
            Назад
          </Button>
          <div className="flex-1" />
          {step < 5 ? (
            <Button size="xl" variant="primary" className="px-5" disabled={!stepValid[step]} onClick={() => setStep((s) => s + 1)}>
              Далее
            </Button>
          ) : (
            <Button size="xl" variant="primary" className="px-5" disabled={!canSubmit || create.isPending} onClick={submit}>
              {create.isPending ? "Создаём…" : "Создать организацию"}
            </Button>
          )}
        </div>
      </Card>
    </>
  );
}
