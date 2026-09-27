import { useState } from "react";
import { useParams } from "react-router";
import { PLAN_FEATURES, usePlan } from "@/entities/plan";
import { routes } from "@/shared/config";
import { Breadcrumbs, Button, Callout, Card, CardHeader, Field, KV, PageTitle, Pill, TextInput, Toggle } from "@/shared/ui";

const priceOf = (label: string) => label.match(/\d[\d\s]*/)?.[0].trim() ?? "0";

export function PlanPage() {
  const { code = "pro" } = useParams();
  const plan = usePlan(code);
  const [active, setActive] = useState(plan.active);
  const [form, setForm] = useState({ name: plan.name, code: plan.code, monthly: priceOf(plan.monthly), yearly: priceOf(plan.yearly) });
  const [features, setFeatures] = useState(PLAN_FEATURES);
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  return (
    <div className="flex max-w-[900px] flex-col gap-4">
      <Breadcrumbs items={[{ label: "Тарифы", to: routes.plans }, { label: plan.name }]} />
      <div className="flex items-center gap-3">
        <PageTitle>{form.name}</PageTitle>
        <Pill tone={active ? "success" : "neutral"}>{active ? "Активен" : "Выключен"}</Pill>
        <span className="text-[13px] text-neutral-400">{plan.subscribers} подписчика</span>
        <div className="flex-1" />
        <Button onClick={() => setActive((a) => !a)}>{active ? "Выключить тариф" : "Включить тариф"}</Button>
        <Button variant="primary">Сохранить</Button>
      </div>
      <div className="grid grid-cols-2 gap-3.5">
        <Card className="flex flex-col gap-3 p-[18px]">
          <div className="text-sm font-medium">Основное</div>
          <Field label="Название">
            <TextInput inputSize="md" value={form.name} onChange={(e) => set({ name: e.target.value })} />
          </Field>
          <Field label="Код">
            <TextInput inputSize="md" numeric value={form.code} onChange={(e) => set({ code: e.target.value })} />
          </Field>
          <div className="flex gap-2.5">
            <Field label="Цена за месяц, KGS" className="flex-1">
              <TextInput inputSize="md" numeric value={form.monthly} onChange={(e) => set({ monthly: e.target.value })} />
            </Field>
            <Field label="Цена за год, KGS" className="flex-1">
              <TextInput inputSize="md" numeric value={form.yearly} onChange={(e) => set({ yearly: e.target.value })} />
            </Field>
          </div>
          <Callout tone="warn" className="px-[13px] py-[11px]">
            Изменение цены действует только на новые оплаты. У {plan.subscribers} действующих подписок цена остаётся прежней до конца оплаченного срока.
          </Callout>
        </Card>
        <Card className="flex flex-col gap-2.5 p-[18px]">
          <div className="text-sm font-medium">Что произойдёт при выключении</div>
          <div className="text-[13px] leading-5 text-neutral-600">
            Тариф пропадёт из приложения — купить его больше нельзя. Те, кто уже оплатил, доживают свой срок: {plan.subscribers} подписки продолжат работать, автопродление у них отключится.
          </div>
          <div className="flex flex-col gap-2 border-t border-neutral-100 pt-3">
            <KV k="Создан" width={150}>
              14 февраля 2026
            </KV>
            <KV k="Последнее изменение" width={150}>
              Ернар К. · 02 сентября 2026
            </KV>
            <KV k="Выручка за месяц" width={150}>
              <span className="font-num">284 700 KGS</span>
            </KV>
          </div>
        </Card>
      </div>
      <Card className="overflow-hidden">
        <CardHeader
          className="px-[18px] py-3.5"
          title="Фичи тарифа"
          subtitle="Список пополняется — новые фичи появляются здесь автоматически"
          action={
            <Button size="sm" icon="plus">
              Добавить фичу
            </Button>
          }
        />
        {features.map((f) => (
          <div key={f.name} className="flex items-center gap-3 border-b border-neutral-50 px-[18px] py-[11px] last:border-b-0">
            <div className="flex-1">
              <div className="text-[13px] font-medium">{f.name}</div>
              <div className="text-xs text-neutral-500">{f.desc}</div>
            </div>
            <Toggle on={f.on} label={f.name} onChange={(on) => setFeatures((fs) => fs.map((x) => (x.name === f.name ? { ...x, on } : x)))} />
          </div>
        ))}
      </Card>
    </div>
  );
}
