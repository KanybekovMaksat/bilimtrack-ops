import { useState, type ReactNode } from "react";
import {
  CATEGORY_LABEL,
  POST_TYPE_LABEL,
  useDeleteForumPost,
  useForumAccount,
  usePublishForumPost,
  useUpdateForumPost,
  type ForumCategory,
  type ForumPostType,
  type ForumPublication,
} from "@/entities/forum-publication";
import { plural } from "@/shared/lib";
import { Button, Callout, CheckBox, ErrorNote, Field, Modal, ModalActions, SectionLabel, Segmented, SelectInput, TextArea, TextInput, Toggle } from "@/shared/ui";
import { ImagesPicker, VideoPicker } from "./media";

const TYPE_OPTIONS = (Object.keys(POST_TYPE_LABEL) as ForumPostType[]).map((value) => ({
  value,
  label: POST_TYPE_LABEL[value],
  icon: value === "news" ? ("speakerphone" as const) : ("message-circle" as const),
}));
const CATEGORY_OPTIONS = (Object.keys(CATEGORY_LABEL) as ForumCategory[]).map((value) => ({ value, label: CATEGORY_LABEL[value] }));

/** Mirrors the backend caps (`MAX_PART_LENGTH`, `MAX_NEWS_TEXT_LENGTH`, `MAX_NEWS_TITLE_LENGTH`). */
const TEXT_LIMIT: Record<ForumPostType, number> = { standard: 1024, news: 10_000 };
const TITLE_LIMIT = 200;

/** Not `Field`: that is a `<label>`, and a click on it would press the picker's first button. */
function MediaBlock({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <SectionLabel className="font-normal">{label}</SectionLabel>
      {children}
    </div>
  );
}

/** `Toggle` only carries an aria-label, so the caption is drawn next to it. */
function PinToggle({ on, onChange }: { on: boolean; onChange: (on: boolean) => void }) {
  return (
    <div className="flex h-10 items-center gap-2 text-sm">
      <Toggle on={on} onChange={onChange} label="Закрепить сверху ленты" />
      Закрепить сверху ленты
    </div>
  );
}

/** Publish as the official account into one or several organizations' forums. */
export function PublishForumPostModal({ onClose }: { onClose: () => void }) {
  const account = useForumAccount();
  const publish = usePublishForumPost();
  const organizations = account.data?.organizations ?? [];
  const [orgIds, setOrgIds] = useState<number[]>([]);
  const [postType, setPostType] = useState<ForumPostType>("news");
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [category, setCategory] = useState<ForumCategory>("general");
  const [isPinned, setPinned] = useState(false);
  const [publishedAt, setPublishedAt] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [video, setVideo] = useState<File | null>(null);

  const news = postType === "news";
  const allChosen = organizations.length > 0 && orgIds.length === organizations.length;
  const hasContent = text.trim().length > 0 || images.length > 0 || video !== null;
  const valid = orgIds.length > 0 && (news ? title.trim().length > 0 : hasContent) && text.length <= TEXT_LIMIT[postType];
  const toggleOrg = (id: number) => setOrgIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));

  return (
    <Modal open onClose={publish.isPending ? () => undefined : onClose} title="Публикация от аккаунта Bilimtrack" width={640}>
      <div className="flex flex-col gap-4">
        {account.error && <ErrorNote error={account.error} prefix="Аккаунт не найден" />}
        {account.data && (
          <div className="text-xs text-neutral-500">
            Автор — <span className="font-num font-medium text-ink">@{account.data.account.username}</span> с галочкой официального аккаунта. В каждой
            выбранной организации появится отдельный пост.
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <SectionLabel>Где опубликовать</SectionLabel>
          <div className="flex flex-col gap-1.5">
            <button
              type="button"
              className="flex items-center gap-2 border-0 bg-transparent p-0 text-left text-sm font-medium"
              onClick={() => setOrgIds(allChosen ? [] : organizations.map((o) => o.id))}
            >
              <CheckBox on={allChosen} /> Все организации
            </button>
            {organizations.map((org) => (
              <button
                key={org.id}
                type="button"
                className="flex items-center gap-2 border-0 bg-transparent p-0 pl-6 text-left text-sm"
                onClick={() => toggleOrg(org.id)}
              >
                <CheckBox on={orgIds.includes(org.id)} /> {org.name}
                {!org.isConnected && <span className="text-xs text-neutral-400">— аккаунт подключится при публикации</span>}
              </button>
            ))}
          </div>
        </div>

        <Segmented<ForumPostType> options={TYPE_OPTIONS} value={postType} onChange={setPostType} />
        {news ? (
          <div className="text-xs text-neutral-500">Новость: заголовок, можно закрепить и запланировать. Лайков и жалоб у новости нет, комментарии есть.</div>
        ) : (
          <div className="text-xs text-neutral-500">Обычный пост в ленте: до 1024 символов, с лайками и комментариями.</div>
        )}

        {news && (
          <Field label="Заголовок" strong>
            <TextInput look="plain" value={title} maxLength={TITLE_LIMIT} onChange={(e) => setTitle(e.target.value)} />
          </Field>
        )}
        <Field label={`Текст · ${text.length}/${TEXT_LIMIT[postType]}`} strong>
          <TextArea look="plain" rows={news ? 8 : 5} value={text} onChange={(e) => setText(e.target.value)} />
        </Field>
        <Field label="Категория">
          <SelectInput options={CATEGORY_OPTIONS} value={category} onChange={(e) => setCategory(e.target.value as ForumCategory)} />
        </Field>
        {news && (
          <div className="flex items-end gap-4">
            <PinToggle on={isPinned} onChange={setPinned} />
            <Field label="Опубликовать позже" className="flex-1">
              <TextInput look="plain" type="datetime-local" value={publishedAt} onChange={(e) => setPublishedAt(e.target.value)} />
            </Field>
          </div>
        )}

        <MediaBlock label="Фото">
          <ImagesPicker files={images} onFilesChange={setImages} disabled={publish.isPending} />
        </MediaBlock>
        <MediaBlock label="Видео">
          <VideoPicker file={video} onFileChange={setVideo} disabled={publish.isPending} />
        </MediaBlock>

        {publish.isPending && video && <Callout tone="info">Загружаем видео — не закрывайте окно, большой файл может грузиться несколько минут.</Callout>}
        <ErrorNote error={publish.error} prefix="Не опубликовано" />
      </div>
      <ModalActions>
        <Button size="xl" onClick={onClose} disabled={publish.isPending}>
          Отмена
        </Button>
        <Button
          size="xl"
          variant="primary"
          icon="send"
          disabled={!valid || publish.isPending}
          onClick={() =>
            publish.mutate(
              { organizationIds: orgIds, postType, title: title.trim(), text, category, isPinned, publishedAt, images, video },
              { onSuccess: onClose },
            )
          }
        >
          {publish.isPending
            ? "Публикуем…"
            : orgIds.length > 1
              ? `Опубликовать в ${orgIds.length} ${plural(orgIds.length, ["организации", "организациях", "организациях"])}`
              : "Опубликовать"}
        </Button>
      </ModalActions>
    </Modal>
  );
}

/** Edit one publication — the copy in a single organization. */
export function EditForumPublicationModal({ post, onClose }: { post: ForumPublication; onClose: () => void }) {
  const update = useUpdateForumPost(post.id);
  const news = post.postType === "news";
  const [title, setTitle] = useState(post.title);
  const [text, setText] = useState(post.text);
  const [category, setCategory] = useState<ForumCategory>(post.category);
  const [isPinned, setPinned] = useState(post.isPinned);
  const [kept, setKept] = useState(post.images);
  const [images, setImages] = useState<File[]>([]);
  const [removeVideo, setRemoveVideo] = useState(false);
  const [video, setVideo] = useState<File | null>(null);
  const current = removeVideo ? null : (post.videos[0] ?? null);
  const valid = (!news || title.trim().length > 0) && text.length <= TEXT_LIMIT[post.postType];

  return (
    <Modal open onClose={update.isPending ? () => undefined : onClose} title={`${POST_TYPE_LABEL[post.postType]} в «${post.organization.name}»`} width={640}>
      <div className="flex flex-col gap-4">
        <div className="text-xs text-neutral-500">Правка касается только этой организации — копии в других организациях не меняются.</div>
        {news && (
          <Field label="Заголовок" strong>
            <TextInput look="plain" value={title} maxLength={TITLE_LIMIT} onChange={(e) => setTitle(e.target.value)} />
          </Field>
        )}
        <Field label={`Текст · ${text.length}/${TEXT_LIMIT[post.postType]}`} strong>
          <TextArea look="plain" rows={news ? 8 : 5} value={text} onChange={(e) => setText(e.target.value)} />
        </Field>
        <Field label="Категория">
          <SelectInput options={CATEGORY_OPTIONS} value={category} onChange={(e) => setCategory(e.target.value as ForumCategory)} />
        </Field>
        {news && <PinToggle on={isPinned} onChange={setPinned} />}
        <MediaBlock label="Фото">
          <ImagesPicker existing={kept} onExistingChange={setKept} files={images} onFilesChange={setImages} disabled={update.isPending} />
        </MediaBlock>
        <MediaBlock label="Видео">
          <VideoPicker current={current} onRemoveCurrent={() => setRemoveVideo(true)} file={video} onFileChange={setVideo} disabled={update.isPending} />
        </MediaBlock>
        <ErrorNote error={update.error} prefix="Не сохранено" />
      </div>
      <ModalActions>
        <Button size="xl" onClick={onClose} disabled={update.isPending}>
          Отмена
        </Button>
        <Button
          size="xl"
          variant="primary"
          disabled={!valid || update.isPending}
          onClick={() =>
            update.mutate(
              {
                title: news ? title.trim() : undefined,
                text,
                category,
                isPinned: news ? isPinned : undefined,
                keepImageIds: kept.map((img) => img.id),
                images,
                removeVideo,
                video,
              },
              { onSuccess: onClose },
            )
          }
        >
          {update.isPending ? "Сохраняем…" : "Сохранить"}
        </Button>
      </ModalActions>
    </Modal>
  );
}

export function DeleteForumPublicationModal({ post, onClose }: { post: ForumPublication; onClose: () => void }) {
  const remove = useDeleteForumPost();
  return (
    <Modal open onClose={onClose} title="Удалить публикацию?">
      <Callout tone="danger">
        {POST_TYPE_LABEL[post.postType]} пропадёт из ленты «{post.organization.name}». Копии в других организациях останутся.
      </Callout>
      <ErrorNote error={remove.error} />
      <ModalActions>
        <Button size="xl" onClick={onClose}>
          Отмена
        </Button>
        <Button size="xl" variant="danger" disabled={remove.isPending} onClick={() => remove.mutate(post.id, { onSuccess: onClose })}>
          {remove.isPending ? "Удаляем…" : "Удалить"}
        </Button>
      </ModalActions>
    </Modal>
  );
}
