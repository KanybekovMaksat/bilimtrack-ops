import { useState } from "react";
import { EDITOR_DRAFT, type ArticleStatus } from "@/entities/article";
import { MediaPickerModal } from "@/features/pick-media";
import { routes } from "@/shared/config";
import { Breadcrumbs, Button, Card, Field, Icon, PageTitle, Segmented, TextArea, TextInput } from "@/shared/ui";

const TOOLS = ["bold", "italic", "h-1", "h-2", "list", "link", "quote"];

export function PostEditorPage() {
  const [status, setStatus] = useState<ArticleStatus>("Черновик");
  const [mediaOpen, setMediaOpen] = useState(false);
  const [props, setProps] = useState(EDITOR_DRAFT.props);
  const [seo, setSeo] = useState(EDITOR_DRAFT.seo);
  const d = EDITOR_DRAFT;

  return (
    <div className="flex flex-col gap-3.5">
      <Breadcrumbs items={[{ label: "Статьи", to: routes.posts }, { label: "Редактор" }]} />
      <div className="flex items-center gap-3">
        <PageTitle>{d.title}</PageTitle>
        <div className="flex-1" />
        <Segmented<ArticleStatus>
          value={status}
          onChange={setStatus}
          options={(["Черновик", "Запланировано", "Опубликовано"] as ArticleStatus[]).map((s) => ({ value: s, label: s }))}
        />
        <Button icon="eye">Предпросмотр</Button>
        <Button variant="primary">Сохранить</Button>
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)_340px] items-start gap-4">
        <Card className="overflow-hidden">
          <div className="flex items-center gap-1 border-b border-neutral-100 bg-neutral-50 px-3 py-2">
            {TOOLS.map((t) => (
              <button key={t} aria-label={t} className="flex size-[30px] items-center justify-center rounded-lg border-0 bg-transparent text-neutral-700 hover:bg-neutral-200">
                <Icon name={t} size={17} />
              </button>
            ))}
            <div className="mx-1 h-5 w-px bg-neutral-200" />
            <Button size="xs" icon="photo" onClick={() => setMediaOpen(true)}>
              Вставить из медиатеки
            </Button>
          </div>
          <div
            contentEditable
            suppressContentEditableWarning
            className="flex min-h-[460px] flex-col gap-3.5 px-7 py-6 outline-none"
          >
            <div className="text-2xl leading-[30px] font-semibold">{d.title}</div>
            <div className="text-[15px] leading-6 text-neutral-700">{d.lead}</div>
            {d.sections.map((s) => (
              <div key={s.heading} className="flex flex-col gap-3.5">
                <div className="mt-1.5 text-[17px] font-semibold">{s.heading}</div>
                <div className="text-[15px] leading-6 text-neutral-700">{s.body}</div>
                <div contentEditable={false} className="flex h-40 flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-neutral-200 text-neutral-400">
                  <Icon name="photo" size={26} />
                  <span className="text-xs">{s.illustration}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
        <div className="flex flex-col gap-3">
          <Card className="flex flex-col gap-3 p-4">
            <div className="text-sm font-medium">Свойства</div>
            {props.map((p, i) => (
              <Field key={p.k} label={p.k} className="gap-[5px]">
                <TextInput inputSize="sm" value={p.v} onChange={(e) => setProps((ps) => ps.map((x, j) => (j === i ? { ...x, v: e.target.value } : x)))} />
              </Field>
            ))}
            <Field label="SEO-описание" className="gap-[5px]">
              <TextArea className="min-h-16 px-[13px] py-[9px]" value={seo} onChange={(e) => setSeo(e.target.value)} />
            </Field>
          </Card>
          <Card className="p-4">
            <div className="mb-2.5 text-sm font-medium">Обложка</div>
            <button
              onClick={() => setMediaOpen(true)}
              className="flex h-[120px] w-full flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-neutral-200 bg-white text-neutral-400 hover:border-brand"
            >
              <Icon name="upload" size={22} />
              <span className="text-xs">Выбрать из медиатеки</span>
            </button>
          </Card>
        </div>
      </div>
      <MediaPickerModal open={mediaOpen} onClose={() => setMediaOpen(false)} />
    </div>
  );
}
