import type { Draft } from "../model";
import { RailBlock } from "./rail-block";

/** Search title and OG description, with the length limits search engines and messengers cut at. */
export function SeoBlock({ draft: d, onChange: set }: { draft: Draft; onChange: (patch: Partial<Draft>) => void }) {
  const seoTitleLen = (d.seoTitle || d.title).length;
  const seoDescLen = (d.seoDesc || d.excerpt).length;
  return (
    <RailBlock label="SEO и превью">
      <div className="ae-stack">
        <div>
          <input className="ae-field" placeholder={d.title || "Title для поиска"} value={d.seoTitle} onChange={(e) => set({ seoTitle: e.target.value })} />
          <div className="ae-hint">
            <span>Заголовок в Google</span>
            <span className={seoTitleLen > 60 ? "over" : undefined}>{seoTitleLen} / 60</span>
          </div>
        </div>
        <div>
          <textarea className="ae-field" placeholder={d.excerpt || "Описание для Telegram и WhatsApp"} value={d.seoDesc} onChange={(e) => set({ seoDesc: e.target.value })} />
          <div className="ae-hint">
            <span>OG-описание</span>
            <span className={seoDescLen > 160 ? "over" : undefined}>{seoDescLen} / 160</span>
          </div>
        </div>
      </div>
    </RailBlock>
  );
}
