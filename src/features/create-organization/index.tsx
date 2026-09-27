import { Fragment, useState } from "react";
import { cn } from "@/shared/lib";
import { Button, Callout, Card, Field, Icon, KV, TextInput, Toggle } from "@/shared/ui";

const STEPS = ["Основные данные", "Тип, пресет и модули", "Первый филиал", "Владелец аккаунта", "Проверка и создание"];

const TYPES = [
  { label: "Школа", icon: "school", desc: "четверти, классное руководство, табели" },
  { label: "Колледж", icon: "building-community", desc: "семестры, группы, практика" },
  { label: "Университет", icon: "building-bank", desc: "кредиты, GPA, факультеты, элективы" },
  { label: "Другое", icon: "dots", desc: "ничего не включаем заранее" },
];

const PRESET_ITEMS: [string, boolean][] = [
  ["Учебный процесс", true],
  ["Оценивание", true],
  ["Финансы", true],
  ["Публичность", true],
  ["Приём и документы", false],
  ["Семестры", true],
  ["Учебная практика", true],
  ["Кураторы групп", true],
  ["Кредитная система", false],
  ["GPA", false],
];

type WizardModule = { key: string; name: string; on: boolean; features: { name: string; on: boolean }[] };

const MODULES: WizardModule[] = [
  { key: "edu", name: "Учебный процесс", on: true, features: [{ name: "Расписание занятий", on: true }, { name: "Замены преподавателей", on: true }, { name: "Электронный журнал", on: true }, { name: "Домашние задания", on: false }] },
  { key: "grade", name: "Оценивание", on: true, features: [{ name: "Пятибалльные оценки", on: true }, { name: "Ведомости и табели", on: true }, { name: "GPA и транскрипт", on: false }] },
  { key: "adm", name: "Приём и документы", on: false, features: [{ name: "Онлайн-заявки", on: false }, { name: "Проверка документов", on: false }] },
  { key: "fin", name: "Финансы", on: true, features: [{ name: "Счета учащимся", on: true }, { name: "Должники", on: true }] },
  { key: "pub", name: "Публичность", on: true, features: [{ name: "Лента новостей", on: true }, { name: "Рейтинг учащихся", on: false }, { name: "Публичные профили", on: true }] },
];

/** Prefilled from the demo request of Бакыт Жунусов (Колледж «Алатау»). */
const INITIAL = {
  name: "Колледж «Алатау»",
  legalName: "ОсОО «Алатау Билим»",
  slug: "alatau",
  timezone: "Кыргызстан · Asia/Bishkek (UTC+6)",
  branch: "Главный корпус",
  address: "г. Бишкек, ул. Киевская 44",
  branchTz: "Asia/Bishkek (UTC+6)",
  owner: "Жунусов Бакыт Асанович",
  email: "b.zhunusov@alatau.kg",
  login: "b.zhunusov",
};

type Props = { initialStep?: number; onCreated: () => void };

export function CreateOrganizationWizard({ initialStep = 1, onCreated }: Props) {
  const [step, setStep] = useState(initialStep);
  const [form, setForm] = useState(INITIAL);
  const [type, setType] = useState("Колледж");
  const [modules, setModules] = useState(MODULES);
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  const toggleModule = (key: string) => setModules((ms) => ms.map((m) => (m.key === key ? { ...m, on: !m.on } : m)));
  const toggleFeature = (key: string, name: string) =>
    setModules((ms) =>
      ms.map((m) => (m.key === key ? { ...m, features: m.features.map((f) => (f.name === name ? { ...f, on: !f.on } : f)) } : m)),
    );

  const onCount = modules.filter((m) => m.on).length;
  const input = (label: string, key: keyof typeof form) => (
    <Field key={key} label={label}>
      <TextInput value={form[key]} onChange={(e) => set({ [key]: e.target.value })} />
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
                {n}
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
            <Callout tone="info" icon="info-circle" className="px-3.5 py-2.5">
              Поля предзаполнены из заявки на демо «Бакыт Жунусов · Колледж «Алатау»»
            </Callout>
            {input("Название организации", "name")}
            {input("Юридическое название", "legalName")}
            {input("Слаг (адрес в системе)", "slug")}
            {input("Страна и часовой пояс", "timezone")}
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-3.5">
            <div className="text-base font-semibold">Тип заведения и пресет модулей</div>
            <div className="grid grid-cols-4 gap-2.5">
              {TYPES.map((t) => {
                const on = type === t.label;
                return (
                  <button
                    key={t.label}
                    onClick={() => setType(t.label)}
                    className={cn("flex flex-col gap-1.5 rounded-[14px] border p-3.5 text-left", on ? "border-brand bg-brand-50" : "border-neutral-200 bg-white")}
                  >
                    <Icon name={t.icon} size={22} className={on ? "text-brand" : "text-ink"} />
                    <div className={cn("text-sm font-medium", on ? "text-brand" : "text-ink")}>{t.label}</div>
                    <div className="text-[11px] leading-[15px] text-neutral-500">{t.desc}</div>
                  </button>
                );
              })}
            </div>
            <div className="rounded-[14px] border border-neutral-200 p-3.5">
              <div className="mb-2.5 text-[13px] font-medium">Пресет «{type}» включит</div>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_ITEMS.map(([label, on]) => (
                  <span
                    key={label}
                    className={cn("inline-flex items-center gap-[5px] rounded-full px-[11px] py-1 text-xs", on ? "bg-green-50 text-green-600" : "bg-neutral-100 text-neutral-500")}
                  >
                    <Icon name={on ? "check" : "x"} size={14} />
                    {label}
                  </span>
                ))}
              </div>
            </div>
            <div className="overflow-hidden rounded-[14px] border border-neutral-200">
              <div className="flex items-center gap-2.5 border-b border-neutral-100 bg-neutral-50 px-4 py-[13px]">
                <div className="flex-1">
                  <div className="text-[13px] font-medium">Модули и фичи — можно править прямо сейчас</div>
                  <div className="text-xs text-neutral-500">Выключенный модуль гасит свои фичи. Всё это потом меняется в карточке организации.</div>
                </div>
                <span className="rounded-full bg-brand-50 px-[11px] py-[3px] text-xs font-medium text-brand">{onCount} из 5 включено</span>
              </div>
              <div className="grid grid-cols-2">
                {modules.map((m) => (
                  <div key={m.key} className="border-r border-b border-neutral-50 px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <span className={cn("flex-1 text-[13px] font-semibold", m.on ? "text-ink" : "text-neutral-400")}>{m.name}</span>
                      <Toggle on={m.on} label={m.name} onChange={() => toggleModule(m.key)} />
                    </div>
                    {m.features.map((f) => (
                      <div key={f.name} className="mt-1.5 ml-1 flex items-center gap-2.5 border-l-2 border-neutral-100 py-[7px] pl-3">
                        <span className={cn("flex-1 text-xs", !m.on ? "text-neutral-300" : f.on ? "text-ink" : "text-neutral-500")}>{f.name}</span>
                        <Toggle size="sm" on={m.on && f.on} disabled={!m.on} label={f.name} onChange={() => toggleFeature(m.key, f.name)} />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-3.5">
            <div className="text-base font-semibold">Первый филиал</div>
            <div className="text-[13px] text-neutral-500">Минимум один филиал обязателен — к нему привязываются группы и расписание.</div>
            {input("Название филиала", "branch")}
            {input("Адрес", "address")}
            {input("Часовой пояс", "branchTz")}
          </div>
        )}

        {step === 4 && (
          <div className="flex flex-col gap-3.5">
            <div className="text-base font-semibold">Владелец аккаунта</div>
            {input("ФИО владельца", "owner")}
            {input("Почта", "email")}
            {input("Логин", "login")}
            <Callout tone="muted" className="text-neutral-700">
              Владелец получает роль «Админ организации» и полный доступ к своей админке. Пароль он задаёт сам по ссылке из письма — мы паролей не видим.
            </Callout>
          </div>
        )}

        {step === 5 && (
          <div className="flex flex-col gap-3.5">
            <div className="text-base font-semibold">Проверка и создание</div>
            {(
              [
                ["Организация", `${form.name} · ${form.slug}`, 1],
                ["Тип и пресет", `${type} · пресет «${type}»`, 2],
                ["Модули", modules.filter((m) => m.on).map((m) => m.name).join(", ") || "—", 2],
                ["Первый филиал", `${form.branch}, ${form.address.split(",")[0].replace("г. ", "")}`, 3],
                ["Владелец", `${form.owner} · ${form.login}`, 4],
                ["Заявка-источник", "Заявка на демо от 20 сен, лендинг", 1],
              ] as [string, string, number][]
            ).map(([k, v, target]) => (
              <Fragment key={k}>
                <div className="flex gap-3 border-b border-neutral-50 pb-2.5">
                  <KV k={k} width={190} className="flex-1">
                    {v}
                  </KV>
                  <button onClick={() => setStep(target)} className="border-0 bg-transparent p-0 text-xs text-brand">
                    Изменить
                  </button>
                </div>
              </Fragment>
            ))}
            <div className="flex flex-col gap-2 rounded-[14px] border border-neutral-200 p-3.5">
              <div className="flex items-center gap-[7px] text-[13px] font-medium">
                <Icon name="mail" size={17} className="text-brand" />
                Что получит владелец на почту
              </div>
              <div className="text-xs leading-[19px] text-neutral-600">
                Письмо на {form.email}: ссылка на admin.bilimtrack.kg/{form.slug}, логин {form.login}, ссылка на создание пароля (действует 72 часа) и короткая инструкция по первому входу.
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-2 border-t border-neutral-100 pt-4">
          <Button size="xl" disabled={step === 1} onClick={() => setStep((s) => Math.max(1, s - 1))}>
            Назад
          </Button>
          <div className="flex-1" />
          <Button size="xl" variant="ghost">
            Сохранить черновик
          </Button>
          <Button size="xl" variant="primary" className="px-5" onClick={() => (step === 5 ? onCreated() : setStep((s) => s + 1))}>
            {step === 5 ? "Создать организацию" : "Далее"}
          </Button>
        </div>
      </Card>
    </>
  );
}
