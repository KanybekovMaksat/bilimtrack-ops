import { useState } from "react";
import {
  ANNOUNCE_CHANNELS,
  ANNOUNCE_ORGS,
  ANNOUNCEMENT_TYPE,
  ORGS_BY_KIND,
  PEOPLE_PER_ORG,
  useAnnouncements,
  type AnnouncementType,
} from "@/entities/announcement";
import { plural, toggleIn } from "@/shared/lib";
import { Button, Callout, Card, Icon, Modal, ModalActions, Segmented, SummaryGrid, TextArea, TextInput, ToggleChip } from "@/shared/ui";

type Audience = "all" | "kind" | "select";

const Label = ({ children }: { children: string }) => <span className="text-xs font-semibold text-neutral-500">{children}</span>;

/** Composer for release / maintenance / important notices to institutions, with live preview. */
export function AnnouncementComposer() {
  const record = useAnnouncements((s) => s.record);
  const [type, setType] = useState<AnnouncementType>("release");
  const [title, setTitle] = useState(ANNOUNCEMENT_TYPE.release.title);
  const [text, setText] = useState(ANNOUNCEMENT_TYPE.release.text);
  const [audience, setAudience] = useState<Audience>("all");
  const [kinds, setKinds] = useState(["Колледжи"]);
  const [orgs, setOrgs] = useState(["МУИТ", "Comtehno"]);
  const [roles, setRoles] = useState(["Администрация", "Преподаватели"]);
  const [channels, setChannels] = useState(["Баннер в панели", "Email"]);
  const [confirming, setConfirming] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const orgCount = audience === "all" ? 34 : audience === "kind" ? kinds.reduce((a, k) => a + ORGS_BY_KIND[k], 0) : orgs.length;
  const orgLabel = `${orgCount} ${plural(orgCount, ["учреждение", "учреждения", "учреждений"])}`;
  const people = (Math.round((orgCount * roles.reduce((a, r) => a + PEOPLE_PER_ORG[r], 0)) / 10) * 10).toLocaleString("ru-RU");
  const t = ANNOUNCEMENT_TYPE[type];

  const changeType = (next: AnnouncementType) => {
    setType(next);
    setTitle(ANNOUNCEMENT_TYPE[next].title);
    setText(ANNOUNCEMENT_TYPE[next].text);
    setToast(null);
  };

  const send = () => {
    const audienceLabel = audience === "all" ? "Все учреждения" : audience === "kind" ? kinds.join(", ") : "Выборочно";
    record({ type, date: "сегодня", title, audience: `${audienceLabel} · ${orgCount}`, reach: "отправляется" });
    setToast(`${orgLabel} · ${channels.join(", ") || "без каналов"}`);
    setConfirming(false);
    changeType(type);
  };

  return (
    <>
      {toast && (
        <Callout tone="success" icon="circle-check" className="text-[13px]">
          Анонс отправлен: {toast}
        </Callout>
      )}
      <div className="grid grid-cols-[minmax(0,1fr)_400px] items-start gap-4">
        <Card className="flex flex-col gap-4 p-[18px]">
          <div className="flex flex-col gap-2">
            <Label>Тип</Label>
            <Segmented<AnnouncementType>
              value={type}
              onChange={changeType}
              options={(Object.keys(ANNOUNCEMENT_TYPE) as AnnouncementType[]).map((k) => ({ value: k, label: ANNOUNCEMENT_TYPE[k].label, icon: ANNOUNCEMENT_TYPE[k].icon }))}
            />
          </div>
          <label className="flex flex-col gap-1.5">
            <Label>Заголовок</Label>
            <TextInput look="plain" value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <label className="flex flex-col gap-1.5">
            <Label>Текст</Label>
            <TextArea look="plain" className="min-h-[92px]" value={text} onChange={(e) => setText(e.target.value)} />
          </label>
          {type === "maint" && (
            <div className="grid grid-cols-2 gap-2.5">
              {[
                ["Начало работ", "28 сен 2026, 02:00"],
                ["Окончание", "28 сен 2026, 04:00"],
              ].map(([k, v]) => (
                <div key={k} className="flex flex-col gap-1.5">
                  <Label>{k}</Label>
                  <div className="flex h-10 items-center gap-2 rounded-full bg-neutral-100 px-4 text-sm">
                    <Icon name="calendar" className="text-neutral-400" />
                    {v}
                  </div>
                </div>
              ))}
              <div className="col-span-2 text-xs text-neutral-500">Время покажем в поясе каждого учреждения. За сутки и за час до начала придёт напоминание.</div>
            </div>
          )}
          <div className="h-px bg-neutral-100" />
          <div className="flex flex-col gap-2">
            <Label>Учреждения</Label>
            <Segmented<Audience>
              value={audience}
              onChange={setAudience}
              options={[
                { value: "all", label: "Все учреждения", icon: "world" },
                { value: "kind", label: "По типу", icon: "category" },
                { value: "select", label: "Выборочно", icon: "list-check" },
              ]}
            />
          </div>
          {audience === "kind" && (
            <div className="flex flex-wrap gap-1.5">
              {Object.keys(ORGS_BY_KIND).map((k) => (
                <ToggleChip key={k} on={kinds.includes(k)} label={`${k} · ${ORGS_BY_KIND[k]}`} onClick={() => setKinds(toggleIn(kinds, k))} />
              ))}
            </div>
          )}
          {audience === "select" && (
            <div className="flex flex-wrap gap-1.5">
              {ANNOUNCE_ORGS.map((o) => (
                <ToggleChip key={o} on={orgs.includes(o)} label={o} onClick={() => setOrgs(toggleIn(orgs, o))} />
              ))}
            </div>
          )}
          <div className="flex flex-col gap-2">
            <Label>Кому внутри учреждения</Label>
            <div className="flex flex-wrap gap-1.5">
              {Object.keys(PEOPLE_PER_ORG).map((r) => (
                <ToggleChip key={r} on={roles.includes(r)} label={r} onClick={() => setRoles(toggleIn(roles, r))} />
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label>Каналы</Label>
            <div className="flex flex-wrap gap-1.5">
              {ANNOUNCE_CHANNELS.map((c) => (
                <ToggleChip key={c} on={channels.includes(c)} label={c} onClick={() => setChannels(toggleIn(channels, c))} />
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 border-t border-neutral-100 pt-3.5">
            <div className="flex-1 text-[13px] text-neutral-700">
              <span className="font-semibold">{orgLabel}</span> · примерно {people} получателей
            </div>
            <Button>Сохранить черновик</Button>
            <Button variant="primary" icon="send" disabled={!title.trim() || !orgCount || !roles.length} onClick={() => setConfirming(true)}>
              Отправить…
            </Button>
          </div>
        </Card>

        <div className="flex flex-col gap-4">
          <Card className="flex flex-col gap-2.5 p-4">
            <Label>Как увидят в панели учреждения</Label>
            <div className="rounded-xl bg-neutral-50 p-3">
              <div className="flex gap-2.5 rounded-xl border border-neutral-200 bg-white px-3.5 py-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full" style={{ background: t.bg, color: t.color }}>
                  <Icon name={t.icon} size={17} />
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="text-[11px] font-semibold" style={{ color: t.color }}>
                    {t.label} · Bilimtrack
                  </div>
                  <div className="text-sm leading-[18px] font-medium">{title}</div>
                  <div className="text-xs leading-[17px] text-neutral-600">{text}</div>
                </div>
                <Icon name="x" size={16} className="text-neutral-400" />
              </div>
            </div>
          </Card>
          <AnnouncementHistory />
        </div>
      </div>

      <Modal open={confirming} onClose={() => setConfirming(false)} title={`Отправить анонс: ${orgLabel}?`}>
        <div className="text-[13px] leading-5 text-neutral-700">«{title}»</div>
        <SummaryGrid
          keyWidth={140}
          rows={[
            ["Учреждения", orgLabel],
            ["Кому", roles.join(", ") || "—"],
            ["Каналы", channels.join(", ") || "—"],
            ["Получателей", `примерно ${people}`],
          ]}
        />
        <Callout tone="warn">Email и push уходят сразу, отозвать их нельзя. Баннер в панели можно снять вручную из истории анонсов.</Callout>
        <ModalActions>
          <Button size="xl" onClick={() => setConfirming(false)}>
            Отмена
          </Button>
          <Button size="xl" variant="primary" onClick={send}>
            Отправить
          </Button>
        </ModalActions>
      </Modal>
    </>
  );
}

function AnnouncementHistory() {
  const history = useAnnouncements((s) => s.history);
  return (
    <Card className="overflow-hidden">
      <div className="border-b border-neutral-100 px-4 py-[13px] text-sm font-medium">История</div>
      {history.map((a, i) => {
        const t = ANNOUNCEMENT_TYPE[a.type];
        return (
          <div key={i} className="flex flex-col gap-[3px] border-b border-neutral-50 px-4 py-[11px] last:border-b-0">
            <div className="flex items-center gap-2">
              <span className="rounded-full px-2 py-px text-[11px] font-medium" style={{ background: t.bg, color: t.color }}>
                {t.label}
              </span>
              <span className="text-[11px] text-neutral-400">{a.date}</span>
            </div>
            <div className="text-[13px] font-medium">{a.title}</div>
            <div className="text-[11px] text-neutral-500">
              {a.audience} · {a.reach}
            </div>
          </div>
        );
      })}
    </Card>
  );
}
