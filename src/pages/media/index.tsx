import { useMedia } from "@/entities/article";
import { Button, Icon, PageHeader } from "@/shared/ui";

export function MediaPage() {
  const media = useMedia();
  return (
    <div className="flex max-w-[1120px] flex-col gap-4">
      <PageHeader
        title="Медиатека"
        subtitle="124 файла · 1,8 ГБ"
        actions={
          <Button variant="primary" icon="upload">
            Загрузить
          </Button>
        }
      />
      <div className="grid grid-cols-6 gap-3">
        {media.map((m) => (
          <div key={m.id} className="cursor-pointer overflow-hidden rounded-xl border border-neutral-200 hover:border-brand">
            <div className="flex h-24 items-center justify-center bg-neutral-100 text-neutral-300">
              <Icon name="photo" size={24} />
            </div>
            <div className="px-2.5 py-2">
              <div className="truncate text-[11px]">{m.name}</div>
              <div className="text-[10px] text-neutral-400">{m.size}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
