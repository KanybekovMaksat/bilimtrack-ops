import { Suspense, useState } from "react";
import { useMedia } from "@/entities/article";
import { cn } from "@/shared/lib";
import { Button, Icon, Modal, ModalActions } from "@/shared/ui";

function MediaGrid({ selected, onSelect }: { selected: number | null; onSelect: (id: number) => void }) {
  const media = useMedia();
  return (
    <div className="grid max-h-[340px] grid-cols-4 gap-2.5 overflow-auto">
      {media.map((m) => (
        <button
          key={m.id}
          onClick={() => onSelect(m.id)}
          className={cn(
            "overflow-hidden rounded-xl border bg-white p-0 text-left hover:border-brand",
            selected === m.id ? "border-brand ring-2 ring-brand/20" : "border-neutral-200",
          )}
        >
          <div className="flex h-[84px] items-center justify-center bg-neutral-100 text-neutral-300">
            <Icon name="photo" size={22} />
          </div>
          <div className="truncate px-[9px] py-[7px] text-[10px]">{m.name}</div>
        </button>
      ))}
    </div>
  );
}

/** Media library picker used by the article editor. */
export function MediaPickerModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [selected, setSelected] = useState<number | null>(null);
  return (
    <Modal open={open} onClose={onClose} width={720} className="p-[22px]">
      <div className="flex items-center gap-2.5">
        <div className="flex-1 text-[17px] font-semibold">Выбрать изображение</div>
        <Button size="md" icon="upload">
          Загрузить
        </Button>
      </div>
      <Suspense fallback={<div className="h-[340px] rounded-xl bg-neutral-50" />}>
        <MediaGrid selected={selected} onSelect={setSelected} />
      </Suspense>
      <ModalActions>
        <Button size="md" className="h-[38px]" onClick={onClose}>
          Отмена
        </Button>
        <Button size="md" className="h-[38px]" variant="primary" disabled={selected === null} onClick={onClose}>
          Вставить
        </Button>
      </ModalActions>
    </Modal>
  );
}
