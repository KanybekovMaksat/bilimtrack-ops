import { cn } from "@/shared/lib";
import { Button } from "@/shared/ui";
import { RailBlock } from "./rail-block";

type Props = { covers: string[]; value: string; uploading: boolean; onChange: (cover: string) => void; onUpload: () => void };

/** Reuse a cover of another article or upload a new one. */
export function CoverBlock({ covers, value, uploading, onChange, onUpload }: Props) {
  return (
    <RailBlock label="Обложка" icon="photo">
      {covers.length ? (
        <div className="ae-covers">
          {[...new Set(covers)].slice(0, 9).map((url) => (
            <button key={url} className={cn(value === url && "is-active")} onClick={() => onChange(value === url ? "" : url)} title="Использовать эту обложку">
              <img src={url} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      ) : (
        <div className="text-xs text-neutral-400">Загруженные обложки статей появятся здесь.</div>
      )}
      <div className="mt-2.5 flex gap-2">
        <Button size="sm" icon="upload" disabled={uploading} onClick={() => onUpload()}>
          Загрузить
        </Button>
        {value && (
          <Button size="sm" variant="ghost" icon="x" onClick={() => onChange("")}>
            Убрать
          </Button>
        )}
      </div>
    </RailBlock>
  );
}
