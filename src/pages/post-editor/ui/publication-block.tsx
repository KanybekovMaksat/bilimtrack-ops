import { slugify } from "@/entities/article";
import { Toggle } from "@/shared/ui";
import type { Draft } from "../model";
import { RailBlock } from "./rail-block";

type Props = { draft: Draft; onChange: (patch: Partial<Draft>) => void; slugTouched: boolean; onSlugTouched: () => void };

/** Date, canonical URL (auto from the title until edited by hand) and the «featured» flag. */
export function PublicationBlock({ draft: d, onChange: set, slugTouched, onSlugTouched }: Props) {
  return (
    <RailBlock label="Публикация" icon="calendar">
      <div className="ae-stack">
        <input type="date" className="ae-field" value={d.date} onChange={(e) => set({ date: e.target.value })} />
        <div>
          <div className="ae-slug">
            <span>/blog/</span>
            <input
              value={d.slug}
              placeholder="url-statyi"
              onChange={(e) => {
                onSlugTouched();
                set({ slug: slugify(e.target.value, 255) || e.target.value.toLowerCase() });
              }}
            />
          </div>
          <div className="ae-hint">
            <span>Канонический URL</span>
            <span className={slugTouched ? undefined : "ok"}>{slugTouched ? "вручную" : "авто"}</span>
          </div>
        </div>
        <label className="flex items-center gap-2.5 text-[13px]">
          <Toggle size="sm" on={d.featured} onChange={(featured) => set({ featured })} label="На главной блога" />
          Закрепить на главной блога
        </label>
      </div>
    </RailBlock>
  );
}
