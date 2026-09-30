import { useState } from "react";
import {
  CATEGORY,
  useDeleteReplyTemplate,
  useReplyTemplates,
  useSaveReplyTemplate,
  type ReplyTemplate,
  type ReplyTemplateInput,
  type TicketCategory,
} from "@/entities/ticket";
import { cn, plural } from "@/shared/lib";
import { Button, Callout, Dropdown, EmptyState, ErrorNote, Field, Icon, Modal, ModalActions, TextArea, TextInput, Toggle } from "@/shared/ui";

const CATEGORIES = Object.keys(CATEGORY) as TicketCategory[];
const BLANK: ReplyTemplateInput = { title: "", text: "", category: "", isActive: true };

/** First line of a template, for the second row of a list item. */
const teaser = (text: string) => text.replace(/\s+/g, " ").trim().slice(0, 80);

type PickerProps = {
  /** Category of the open ticket: its templates go first. */
  category: TicketCategory;
  onPick: (template: ReplyTemplate) => void;
};

/** «Шаблон» in the reply box: a searchable list of canned replies, with the editor one click away. */
export function ReplyTemplatePicker({ category, onPick }: PickerProps) {
  const templates = useReplyTemplates().data ?? [];
  const [managing, setManaging] = useState(false);
  // Templates of the ticket's category first, then the general ones; the server order is kept inside each group.
  const rank = (t: ReplyTemplate) => (t.category === category ? 0 : t.category === "" ? 1 : 2);
  const sorted = templates.map((t, i) => ({ t, i })).sort((a, b) => rank(a.t) - rank(b.t) || a.i - b.i);

  return (
    <>
      <Dropdown<string>
        look="chip"
        searchable
        searchPlaceholder="Название или текст шаблона"
        placeholder="Шаблон ответа"
        menuWidth={380}
        value={null}
        onChange={(id) => {
          const picked = templates.find((t) => String(t.id) === id);
          if (picked) onPick(picked);
        }}
        options={sorted.map(({ t }) => ({ value: String(t.id), label: t.title, hint: teaser(t.text), icon: "template" }))}
        footer={(close) => (
          <button
            type="button"
            onClick={() => {
              close();
              setManaging(true);
            }}
            className="flex w-full items-center gap-2 border-0 border-t border-neutral-100 bg-transparent px-3.5 py-2.5 text-left text-[13px] text-brand hover:bg-neutral-50"
          >
            <Icon name="pencil" size={15} />
            Настроить шаблоны
          </button>
        )}
      />
      {managing && <ManageReplyTemplatesModal onClose={() => setManaging(false)} />}
    </>
  );
}

/** Editor of the team's canned replies: list on the left, the chosen template on the right. */
export function ManageReplyTemplatesModal({ onClose }: { onClose: () => void }) {
  const list = useReplyTemplates({ all: true });
  const save = useSaveReplyTemplate();
  const remove = useDeleteReplyTemplate();
  const templates = list.data ?? [];
  // "new" — an unsaved template; a number — the one being edited.
  const [selected, setSelected] = useState<number | "new" | null>(null);
  const [form, setForm] = useState<ReplyTemplateInput>(BLANK);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const open = (t: ReplyTemplate | "new") => {
    setSelected(t === "new" ? "new" : t.id);
    setForm(t === "new" ? BLANK : { title: t.title, text: t.text, category: t.category, isActive: t.isActive });
    setConfirmDelete(false);
    save.reset();
    remove.reset();
  };
  const set = (patch: Partial<ReplyTemplateInput>) => setForm((prev) => ({ ...prev, ...patch }));
  const valid = form.title.trim().length > 0 && form.text.trim().length > 0;
  const pending = save.isPending || remove.isPending;

  const submit = () =>
    save.mutate(
      { ...form, title: form.title.trim(), text: form.text.trim(), id: selected === "new" || selected === null ? undefined : selected },
      { onSuccess: (saved) => setSelected(saved.id) },
    );

  return (
    <Modal open onClose={onClose} width={920} title="Шаблоны ответов">
      <div className="grid min-h-[420px] grid-cols-[300px_minmax(0,1fr)] gap-4">
        <div className="flex min-h-0 flex-col gap-2">
          <Button size="sm" icon="plus" onClick={() => open("new")}>
            Новый шаблон
          </Button>
          <div className="flex max-h-[460px] flex-col gap-1 overflow-auto">
            {templates.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => open(t)}
                className={cn(
                  "flex flex-col gap-0.5 rounded-xl border px-3 py-2 text-left",
                  selected === t.id ? "border-brand bg-brand-50" : "border-transparent hover:bg-neutral-50",
                  !t.isActive && "opacity-60",
                )}
              >
                <span className="truncate text-[13px] font-medium">{t.title}</span>
                <span className="truncate text-[11px] text-neutral-400">
                  {t.isActive ? (t.category ? CATEGORY[t.category] : "Любая категория") : "Выключен"} · {t.usageCount}{" "}
                  {plural(t.usageCount, ["ответ", "ответа", "ответов"])}
                </span>
              </button>
            ))}
            {list.isLoading && <div className="h-24 animate-pulse rounded-xl bg-neutral-50" />}
            {!list.isLoading && !templates.length && <div className="px-3 py-6 text-center text-xs text-neutral-400">Шаблонов пока нет</div>}
          </div>
          <ErrorNote error={list.error} />
        </div>

        {selected === null ? (
          <EmptyState icon="template" title="Выберите шаблон" description="Или создайте новый. Шаблоны общие для всей команды поддержки." />
        ) : (
          <div className="flex flex-col gap-3">
            <Field label="Название" strong>
              <TextInput look="plain" value={form.title} maxLength={120} onChange={(e) => set({ title: e.target.value })} placeholder="Например: Забыли пароль" />
            </Field>
            <Field label="Категория обращений" strong>
              <Dropdown<TicketCategory>
                clearable
                placeholder="Любая категория"
                value={form.category || null}
                onChange={(c) => set({ category: c ?? "" })}
                options={CATEGORIES.map((c) => ({ value: c, label: CATEGORY[c] }))}
              />
            </Field>
            <Field label="Текст ответа" strong>
              <TextArea look="plain" rows={9} value={form.text} onChange={(e) => set({ text: e.target.value })} />
            </Field>
            <div className="text-xs leading-[18px] text-neutral-500">
              Подстановки: <code className="font-mono">{"{name}"}</code> — имя автора обращения, <code className="font-mono">{"{ticket}"}</code> — номер тикета,{" "}
              <code className="font-mono">{"{operator}"}</code> — ваше имя. Шаблон вставляется в поле ответа уже с подставленными значениями, и его можно поправить перед отправкой.
            </div>
            <label className="flex items-center gap-2.5 text-[13px]">
              <Toggle size="sm" on={form.isActive} onChange={(on) => set({ isActive: on })} label="Показывать в списке шаблонов" />
              Показывать в списке при ответе
            </label>
            <ErrorNote error={save.error ?? remove.error} />
            {confirmDelete && selected !== "new" && (
              <Callout tone="danger">Шаблон удалится у всей команды. Уже отправленные ответы не изменятся.</Callout>
            )}
            <ModalActions className="mt-auto">
              {selected !== "new" &&
                (confirmDelete ? (
                  <Button size="xl" variant="danger" disabled={pending} onClick={() => remove.mutate(selected, { onSuccess: () => setSelected(null) })}>
                    {remove.isPending ? "Удаляем…" : "Да, удалить"}
                  </Button>
                ) : (
                  <Button size="xl" variant="dangerOutline" disabled={pending} onClick={() => setConfirmDelete(true)}>
                    Удалить
                  </Button>
                ))}
              <div className="flex-1" />
              <Button size="xl" onClick={onClose}>
                Закрыть
              </Button>
              <Button size="xl" variant="primary" disabled={!valid || pending} onClick={submit}>
                {save.isPending ? "Сохраняем…" : "Сохранить"}
              </Button>
            </ModalActions>
          </div>
        )}
      </div>
    </Modal>
  );
}
