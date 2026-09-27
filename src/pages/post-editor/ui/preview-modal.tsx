import { Button, Modal, ModalActions } from "@/shared/ui";
import type { Draft } from "../model";

type Props = {
  html: string;
  draft: Draft;
  categoryName?: string;
  tone: { bg: string; fg: string };
  authorName?: string;
  minutes: number;
  onClose: () => void;
};

/** The article as the blog will show it (content is the editor's own HTML). */
export function PreviewModal({ html, draft: d, categoryName, tone, authorName, minutes, onClose }: Props) {
  return (
    <Modal open onClose={onClose} width={860} className="gap-5 p-9">
      {d.cover && <img src={d.cover} alt="" className="aspect-video w-full rounded-3xl object-cover" />}
      <span className="ae-tag self-start" style={{ background: tone.bg, color: tone.fg }}>
        {categoryName ?? "Категория"}
      </span>
      <h1 className="m-0 text-[38px] leading-[1.12] font-bold tracking-[-0.03em]">{d.title || "Без заголовка"}</h1>
      {d.excerpt && <p className="m-0 text-lg leading-relaxed text-neutral-500">{d.excerpt}</p>}
      <div className="text-xs text-neutral-400">
        {authorName} · {minutes} мин чтения · /blog/{d.slug}
      </div>
      <div className="ae-prose" dangerouslySetInnerHTML={{ __html: html }} />
      <ModalActions>
        <Button size="xl" onClick={onClose}>
          Закрыть
        </Button>
      </ModalActions>
    </Modal>
  );
}
