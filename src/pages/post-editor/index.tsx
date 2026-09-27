import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import "./editor.css";
import { useEffect, useEffectEvent, useLayoutEffect, useRef, useState } from "react";
import { ru } from "@blocknote/core/locales";
import { BlockNoteView } from "@blocknote/mantine";
import { useCreateBlockNote } from "@blocknote/react";
import { Link, useNavigate, useParams } from "react-router";
import {
  categoryTone,
  slugify,
  uploadBlogImage,
  useArticle,
  useArticleAction,
  useArticlesSoft,
  useAuthors,
  useCategories,
  useSaveArticle,
  useSaveDict,
  type Article,
  type ArticleStatus,
  type BlogAuthor,
} from "@/entities/article";
import { useSession } from "@/entities/session";
import { BLOG_URL, routes } from "@/shared/config";
import { cn, plural } from "@/shared/lib";
import { Button, EmptyState, Icon, type IconName, PageSkeleton } from "@/shared/ui";
import { fromArticle, today, type Draft } from "./model";
import { PreviewModal } from "./ui/preview-modal";
import { RailBlock } from "./ui/rail-block";
import { CoverBlock } from "./ui/cover-block";
import { DeleteArticleModal } from "./ui/delete-article-modal";
import { PublicationBlock } from "./ui/publication-block";
import { SeoBlock } from "./ui/seo-block";
import { Toast } from "./ui/toast";

/** Route /posts/editor[/:id]: loads the article first, then mounts the editor once with its content. */
export function PostEditorPage() {
  const { id } = useParams();
  const article = useArticle(id ?? null);
  if (id && article.isLoading) return <PageSkeleton />;
  if (id && article.error) return <EmptyState icon="article" title="Статья не открылась" description={article.error.message} />;
  return <Editor key={id ?? "new"} article={article.data} />;
}

function Editor({ article }: { article: Article | undefined }) {
  const navigate = useNavigate();
  const me = useSession((s) => s.user);
  const categories = useCategories().data ?? [];
  const authors = useAuthors().data ?? [];
  const covers = (useArticlesSoft().data ?? []).map((a) => a.coverImageUrl).filter((u): u is string => !!u);
  const save = useSaveArticle();
  const action = useArticleAction();
  const createAuthor = useSaveDict<BlogAuthor>("authors");

  const [id, setId] = useState<string | null>(article?.id ?? null);
  const [d, setD] = useState<Draft>(() => fromArticle(article));
  const [slugTouched, setSlugTouched] = useState(!!article);
  const [dirty, setDirty] = useState(false);
  const [words, setWords] = useState(0);
  const [toast, setToast] = useState<{ text: string; icon: IconName } | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [uploading, setUploading] = useState(false);
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const excerptRef = useRef<HTMLTextAreaElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const editor = useCreateBlockNote({ dictionary: ru, uploadFile: uploadBlogImage });

  // Existing HTML → blocks once, when the editor is ready; that load is not an edit.
  const hydrating = useRef(true);
  const hydrate = useEffectEvent(() => {
    if (article?.contentRu) editor.replaceBlocks(editor.document, editor.tryParseHTMLToBlocks(article.contentRu));
    countWords();
  });
  useEffect(() => {
    hydrate();
    // BlockNote reports the initial replace through onChange a tick later.
    const t = setTimeout(() => (hydrating.current = false), 100);
    return () => clearTimeout(t);
  }, []);

  // Until chosen explicitly, the first category and author are used.
  const category = d.category || categories[0]?.id || "";
  const author = d.author || authors[0]?.id || "";

  // Title and excerpt grow with their text.
  useLayoutEffect(() => {
    for (const el of [titleRef.current, excerptRef.current]) {
      if (el) {
        el.style.height = "auto";
        el.style.height = `${el.scrollHeight}px`;
      }
    }
  }, [d.title, d.excerpt]);

  const set = (patch: Partial<Draft>) => {
    setD((x) => {
      const next = { ...x, ...patch };
      if ("title" in patch && !slugTouched) next.slug = slugify(patch.title ?? "");
      return next;
    });
    setDirty(true);
  };

  function countWords() {
    const text = `${d.title} ${d.excerpt} ${editor.domElement?.innerText ?? ""}`.trim();
    setWords(text ? text.split(/\s+/).filter(Boolean).length : 0);
  }

  const showToast = (text: string, icon: IconName = "check") => {
    setToast({ text, icon });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  };

  const missing = !d.title.trim() ? "Добавьте заголовок статьи" : !category ? "Выберите категорию" : !author ? "Выберите автора" : null;

  const persist = (status: ArticleStatus = d.status, silent = false) => {
    if (missing) {
      showToast(missing, "alert-circle");
      if (!d.title.trim()) titleRef.current?.focus();
      return;
    }
    const html = editor.blocksToFullHTML(editor.document);
    save.mutate(
      {
        id,
        titleRu: d.title.trim(),
        excerptRu: d.excerpt.trim(),
        contentRu: html,
        category,
        author,
        status,
        slug: d.slug || slugify(d.title),
        publishedAt: status === "published" ? new Date(d.date || today()).toISOString() : d.date ? new Date(d.date).toISOString() : null,
        coverImageUrl: d.cover,
        seoTitleRu: d.seoTitle,
        seoDescriptionRu: d.seoDesc,
        isFeatured: d.featured,
      },
      {
        onSuccess: (saved) => {
          setDirty(false);
          setD((x) => ({ ...x, status: saved.status, slug: saved.slug }));
          if (!id) {
            setId(saved.id);
            navigate(routes.postEdit(saved.id), { replace: true });
          }
          if (!silent) showToast(status === "published" ? `Опубликовано на /blog/${saved.slug}` : "Сохранено");
        },
        onError: (e) => showToast(e.message, "alert-circle"),
      },
    );
  };

  // Autosave an existing article 2 s after the last change (drafts only: a published one is saved explicitly).
  useEffect(() => {
    if (!dirty || !id || d.status === "published" || missing) return;
    const t = setTimeout(() => persist(d.status, true), 2000);
    return () => clearTimeout(t);
  });

  const onCover = async (file: File) => {
    setUploading(true);
    try {
      set({ cover: await uploadBlogImage(file) });
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Не удалось загрузить обложку", "alert-circle");
    } finally {
      setUploading(false);
    }
  };

  const minutes = Math.max(1, Math.round(words / 200));
  const tone = categoryTone(categories, category);
  const categoryName = categories.find((c) => c.id === category)?.nameRu;
  const myName = me?.fullName || me?.username || "";

  return (
    <div className="ae">
      <div className="ae-col">
        <div className="ae-topbar">
          <Link to={routes.posts} className="ae-back">
            <Icon name="arrow-left" size={16} />
            Статьи
          </Link>
          <span className="ae-crumb">
            Статьи&nbsp; /&nbsp; <b>{id ? "Редактирование" : "Новая статья"}</b>
          </span>
          <span className="flex-1" />
          <span className={cn("ae-save", dirty && "is-dirty")}>
            <Icon name="device-floppy" size={16} />
            <span className="ae-save-label">{save.isPending ? "Сохраняем…" : dirty ? "Несохранённые изменения" : id ? "Сохранено" : "Черновик не сохранён"}</span>
          </span>
          <Button size="sm" icon="eye" onClick={() => setPreview(editor.blocksToFullHTML(editor.document))}>
            Предпросмотр
          </Button>
          {d.status === "published" && id && (
            <Button size="sm" icon="external-link" onClick={() => window.open(`${BLOG_URL}/${d.slug}`, "_blank", "noopener")}>
              На сайте
            </Button>
          )}
          <Button size="sm" variant="primary" disabled={save.isPending} onClick={() => persist("published")}>
            {d.status === "published" ? "Обновить" : "Опубликовать"}
          </Button>
        </div>

        <div className="ae-scroll">
          <div className="ae-canvas">
            <input
              ref={coverRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void onCover(f);
                e.target.value = "";
              }}
            />
            <button className={cn("ae-cover", d.cover && "has-cover")} onClick={() => coverRef.current?.click()} disabled={uploading}>
              {d.cover && <img src={d.cover} alt="" />}
              {!d.cover && (
                <span className="ae-cover-hint">
                  <Icon name={uploading ? "refresh" : "photo"} size={30} className={uploading ? "animate-spin" : undefined} />
                  {uploading ? "Загружаем…" : "Добавить обложку 16:9"}
                </span>
              )}
              {d.cover && (
                <span className="ae-cover-edit">
                  <Icon name="photo" size={15} />
                  {uploading ? "Загружаем…" : "Изменить"}
                </span>
              )}
            </button>

            <div className="ae-meta">
              <span className="ae-tag" style={{ background: tone.bg, color: tone.fg }}>
                {categoryName ?? "Категория"}
              </span>
              {d.featured && (
                <span className="ae-tag" style={{ background: "var(--color-amber-50)", color: "var(--color-amber-700)" }}>
                  На главной
                </span>
              )}
            </div>

            <textarea ref={titleRef} className="ae-title" rows={1} placeholder="Заголовок статьи" value={d.title} onChange={(e) => set({ title: e.target.value })} />
            <textarea
              ref={excerptRef}
              className="ae-excerpt"
              rows={2}
              placeholder="Краткое описание — 1–2 строки, появится в карточке и превью для Telegram"
              value={d.excerpt}
              onChange={(e) => set({ excerpt: e.target.value })}
            />

            <div className="ae-body">
              <BlockNoteView
                editor={editor}
                theme="light"
                onChange={() => {
                  if (hydrating.current) return;
                  setDirty(true);
                  countWords();
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <aside className="ae-rail">
        <div className="ae-actions">
          <Button size="md" variant="outline" icon="device-floppy" disabled={save.isPending} onClick={() => persist()}>
            Сохранить
          </Button>
          <Button size="md" variant="primary" disabled={save.isPending} onClick={() => persist("published")}>
            Опубликовать
          </Button>
        </div>

        <RailBlock label="Статус">
          <div className="ae-segment">
            {(
              [
                ["draft", "Черновик"],
                ["published", "Опубликовано"],
                ...(d.status === "archived" ? [["archived", "Архив"]] : []),
              ] as [ArticleStatus, string][]
            ).map(([v, label]) => (
              <button key={v} data-v={v} className={cn(d.status === v && "is-active")} onClick={() => set({ status: v })}>
                <span className="dot" />
                {label}
              </button>
            ))}
          </div>
        </RailBlock>

        <RailBlock label="Категория" icon="tag">
          <select className="ae-field" value={category} onChange={(e) => set({ category: e.target.value })}>
            {!categories.length && <option value="">Нет категорий</option>}
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nameRu}
              </option>
            ))}
          </select>
          {!categories.length && (
            <div className="ae-hint">
              <Link to={routes.dicts}>Создать категорию →</Link>
            </div>
          )}
        </RailBlock>

        <RailBlock label="Автор" icon="user">
          {authors.length ? (
            <select className="ae-field" value={author} onChange={(e) => set({ author: e.target.value })}>
              {authors.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          ) : (
            <Button
              size="md"
              icon="plus"
              className="w-full"
              disabled={!myName || createAuthor.isPending}
              onClick={() => createAuthor.mutate({ name: myName }, { onSuccess: (a) => set({ author: a.id }) })}
            >
              Создать автора «{myName}»
            </Button>
          )}
        </RailBlock>

        <RailBlock label="Время чтения" icon="clock">
          <div className="ae-readtime">
            <b>{minutes}</b>
            <span>
              <strong>
                {words} {plural(words, ["слово", "слова", "слов"])}
              </strong>
              считается автоматически
              <br />
              (~200 слов / мин)
            </span>
          </div>
        </RailBlock>

        <PublicationBlock draft={d} onChange={set} slugTouched={slugTouched} onSlugTouched={() => setSlugTouched(true)} />

        <CoverBlock
          covers={covers}
          value={d.cover}
          uploading={uploading}
          onChange={(cover) => set({ cover })}
          onUpload={() => coverRef.current?.click()}
        />

        <SeoBlock draft={d} onChange={set} />

        {id && (
          <RailBlock>
            <div className="flex flex-col gap-2">
              {d.status === "published" && (
                <Button size="md" icon="archive" onClick={() => action.mutate({ id, action: "archive" }, { onSuccess: () => (setD((x) => ({ ...x, status: "archived" })), showToast("Статья снята с публикации")) })}>
                  Снять с публикации
                </Button>
              )}
              <button className="ae-danger" onClick={() => setConfirmDelete(true)}>
                <Icon name="trash" size={16} />
                Удалить статью
              </button>
            </div>
          </RailBlock>
        )}
      </aside>

      {toast && <Toast text={toast.text} icon={toast.icon} />}

      {preview !== null && (
        <PreviewModal
          html={preview}
          draft={d}
          categoryName={categoryName}
          tone={tone}
          authorName={authors.find((a) => a.id === author)?.name}
          minutes={minutes}
          onClose={() => setPreview(null)}
        />
      )}

      {confirmDelete && id && (
        <DeleteArticleModal id={id} onClose={() => setConfirmDelete(false)} onDeleted={() => navigate(routes.posts, { replace: true })} />
      )}
    </div>
  );
}
