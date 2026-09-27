import { useRef, useState } from "react";
import { useNavigate } from "react-router";
import { ARTICLE_STATUS, useArticles, useUploadImage } from "@/entities/article";
import { routes } from "@/shared/config";
import { plural } from "@/shared/lib";
import { Button, Callout, EmptyState, Icon, Modal, ModalActions, PageHeader, Pill, SecretValue } from "@/shared/ui";

/** Covers of all articles in one gallery; uploads go through cms/media (compressed to WebP on the server). */
export function MediaPage() {
  const articles = useArticles();
  const navigate = useNavigate();
  const upload = useUploadImage();
  const fileRef = useRef<HTMLInputElement>(null);
  const [viewing, setViewing] = useState<{ url: string; title: string; id?: string } | null>(null);
  const [uploaded, setUploaded] = useState<string[]>([]);
  const withCover = articles.filter((a) => a.coverImageUrl);
  const without = articles.length - withCover.length;

  return (
    <div className="flex max-w-[1180px] flex-col gap-4">
      <PageHeader
        title="Обложки"
        subtitle={`${withCover.length} из ${articles.length} статей с обложкой`}
        actions={
          <>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) upload.mutate(f, { onSuccess: (url) => setUploaded((u) => [url, ...u]) });
                e.target.value = "";
              }}
            />
            <Button variant="primary" icon="upload" disabled={upload.isPending} onClick={() => fileRef.current?.click()}>
              {upload.isPending ? "Загружаем…" : "Загрузить изображение"}
            </Button>
          </>
        }
      />
      {upload.error && <Callout tone="danger">{upload.error.message}</Callout>}
      {without > 0 && (
        <Callout tone="warn" icon="photo" iconClassName="text-warn">
          {without} {plural(without, ["статья", "статьи", "статей"])} без обложки — в ленте блога и в превью Telegram они выглядят пустыми.
        </Callout>
      )}
      {uploaded.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="text-xs font-semibold text-neutral-500">Загружено сейчас — ссылку можно вставить в статью</div>
          {uploaded.map((url) => (
            <SecretValue key={url} label="Ссылка" value={url} />
          ))}
        </div>
      )}
      {withCover.length ? (
        <div className="grid grid-cols-4 gap-3">
          {withCover.map((a) => (
            <button
              key={a.id}
              onClick={() => setViewing({ url: a.coverImageUrl!, title: a.titleRu, id: a.id })}
              className="overflow-hidden rounded-2xl border border-neutral-200 bg-white p-0 text-left hover:border-brand"
            >
              <img src={a.coverImageUrl} alt="" loading="lazy" className="aspect-video w-full object-cover" />
              <div className="flex flex-col gap-1 px-3 py-2.5">
                <div className="line-clamp-2 text-[13px] leading-[17px] font-medium">{a.titleRu}</div>
                <div className="flex items-center gap-1.5 text-[11px] text-neutral-400">
                  <Pill size="sm" tone={ARTICLE_STATUS[a.status].tone}>
                    {ARTICLE_STATUS[a.status].label}
                  </Pill>
                  {a.categoryName}
                </div>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-neutral-200">
          <EmptyState icon="images" title="Обложек пока нет" description="Добавьте обложку в редакторе статьи — она появится здесь." />
        </div>
      )}
      {viewing && (
        <Modal open onClose={() => setViewing(null)} width={960} title={viewing.title}>
          <img src={viewing.url} alt="" className="w-full rounded-2xl" />
          <SecretValue label="Ссылка" value={viewing.url} />
          <ModalActions>
            <Button size="xl" icon="external-link" onClick={() => window.open(viewing.url, "_blank", "noopener")}>
              Оригинал
            </Button>
            {viewing.id && (
              <Button size="xl" variant="primary" icon="pencil" onClick={() => navigate(routes.postEdit(viewing.id!))}>
                Открыть статью
              </Button>
            )}
          </ModalActions>
        </Modal>
      )}
      <p className="m-0 flex items-center gap-1.5 text-xs text-neutral-400">
        <Icon name="info-circle" size={14} /> Обложка — 16:9. Сервер сжимает изображение в WebP.
      </p>
    </div>
  );
}
