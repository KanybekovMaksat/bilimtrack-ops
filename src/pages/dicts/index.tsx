import { useState } from "react";
import { useSearchParams } from "react-router";
import {
  categoryTone,
  slugify,
  useArticlesSoft,
  useAuthors,
  useCategories,
  useDeleteDict,
  useSaveDict,
  useTags,
  useUploadImage,
  type BlogAuthor,
  type BlogCategory,
  type BlogTag,
} from "@/entities/article";
import { plural } from "@/shared/lib";
import { Avatar, Button, Callout, EmptyState, Field, Icon, Modal, ModalActions, PageHeader, TextArea, TextInput, Tabs } from "@/shared/ui";

type Kind = "categories" | "authors" | "tags";

/** Blog dictionaries: categories (with descriptions in three languages), authors (with avatar) and tags. */
export function DictsPage() {
  const [params, setParams] = useSearchParams();
  const kind = (["categories", "authors", "tags"] as Kind[]).includes(params.get("tab") as Kind) ? (params.get("tab") as Kind) : "categories";
  const categories = useCategories();
  const authors = useAuthors();
  const tags = useTags();
  const articles = useArticlesSoft().data ?? [];
  const [editing, setEditing] = useState<{ kind: Kind; row: Record<string, string> | null } | null>(null);
  const remove = useDeleteDict(kind);

  const usedBy = (id: string) =>
    kind === "categories" ? articles.filter((a) => a.category === id).length : kind === "authors" ? articles.filter((a) => a.author === id).length : null;

  const rows: { id: string; title: string; sub: string; row: Record<string, string>; icon?: string; avatar?: string; tone?: { bg: string; fg: string } }[] =
    kind === "categories"
      ? (categories.data ?? []).map((c) => ({ id: c.id, title: c.nameRu, sub: c.slug, row: c as unknown as Record<string, string>, tone: categoryTone(categories.data ?? [], c.id) }))
      : kind === "authors"
        ? (authors.data ?? []).map((a) => ({ id: a.id, title: a.name, sub: a.bioRu || "без описания", row: a as unknown as Record<string, string>, avatar: a.avatarUrl }))
        : (tags.data ?? []).map((t) => ({ id: t.id, title: t.nameRu, sub: t.slug, row: t as unknown as Record<string, string>, icon: "hash" }));
  const loading = kind === "categories" ? categories.isLoading : kind === "authors" ? authors.isLoading : tags.isLoading;
  const error = (kind === "categories" ? categories.error : kind === "authors" ? authors.error : tags.error) ?? remove.error;
  const label = { categories: "категорию", authors: "автора", tags: "тег" }[kind];

  return (
    <div className="flex max-w-[900px] flex-col gap-4">
      <PageHeader
        title="Категории и авторы"
        subtitle="справочники блога"
        actions={
          <Button variant="primary" icon="plus" onClick={() => setEditing({ kind, row: null })}>
            Добавить {label}
          </Button>
        }
      />
      <Tabs<Kind>
        value={kind}
        onChange={(k) => setParams({ tab: k }, { replace: true })}
        items={[
          { key: "categories", label: "Категории", count: categories.data?.length },
          { key: "authors", label: "Авторы", count: authors.data?.length },
          { key: "tags", label: "Теги", count: tags.data?.length },
        ]}
      />
      {error && <Callout tone="danger">{error.message}</Callout>}
      <div className="overflow-auto rounded-xl border border-neutral-200">
        {loading && <div className="h-32 animate-pulse bg-neutral-50" />}
        {!loading && !rows.length && <EmptyState icon="category" title="Пока пусто" description="Добавьте первую запись." />}
        {rows.map((r) => {
          const used = usedBy(r.id);
          return (
            <div key={r.id} className="flex items-center gap-3 border-b border-neutral-100 px-4 py-3 last:border-b-0 hover:bg-neutral-50">
              {r.avatar !== undefined ? (
                r.avatar ? (
                  <img src={r.avatar} alt="" className="size-8 rounded-full object-cover" />
                ) : (
                  <Avatar icon="user" size={32} className="text-neutral-400" />
                )
              ) : r.tone ? (
                <span className="size-3 rounded-full" style={{ background: r.tone.fg }} />
              ) : (
                <Icon name={r.icon ?? "tag"} size={16} className="text-neutral-400" />
              )}
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">{r.title}</span>
                <span className="block truncate font-num text-xs text-neutral-400">{r.sub}</span>
              </span>
              {used !== null && (
                <span className="w-[110px] text-xs text-neutral-500">
                  {used} {plural(used, ["статья", "статьи", "статей"])}
                </span>
              )}
              {kind !== "tags" && <Button size="xs" variant="ghost" icon="pencil" aria-label="Изменить" onClick={() => setEditing({ kind, row: r.row })} />}
              <Button
                size="xs"
                variant="ghost"
                icon="trash"
                aria-label="Удалить"
                title={used ? "Сначала перенесите статьи в другую запись" : "Удалить"}
                disabled={!!used || remove.isPending}
                onClick={() => remove.mutate(r.id)}
              />
            </div>
          );
        })}
      </div>
      <p className="m-0 text-xs text-neutral-400">Категорию или автора со статьями удалить нельзя — сначала перенесите статьи.</p>
      {editing?.kind === "categories" && <CategoryModal row={editing.row as unknown as BlogCategory | null} onClose={() => setEditing(null)} />}
      {editing?.kind === "authors" && <AuthorModal row={editing.row as unknown as BlogAuthor | null} onClose={() => setEditing(null)} />}
      {editing?.kind === "tags" && <TagModal onClose={() => setEditing(null)} />}
    </div>
  );
}

function CategoryModal({ row, onClose }: { row: BlogCategory | null; onClose: () => void }) {
  const save = useSaveDict<BlogCategory>("categories");
  const [f, setF] = useState({
    nameRu: row?.nameRu ?? "",
    nameKy: row?.nameKy ?? "",
    nameEn: row?.nameEn ?? "",
    slug: row?.slug ?? "",
    descriptionRu: row?.descriptionRu ?? "",
  });
  const [slugTouched, setSlugTouched] = useState(!!row);
  return (
    <Modal open onClose={onClose} width={560} title={row ? `Категория · ${row.nameRu}` : "Новая категория"}>
      <Field label="Название (рус.) · обязательно" strong>
        <TextInput look="plain" autoFocus value={f.nameRu} onChange={(e) => setF({ ...f, nameRu: e.target.value, slug: slugTouched ? f.slug : slugify(e.target.value, 100) })} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Название (кырг.)" strong>
          <TextInput look="plain" value={f.nameKy} onChange={(e) => setF({ ...f, nameKy: e.target.value })} />
        </Field>
        <Field label="Название (англ.)" strong>
          <TextInput look="plain" value={f.nameEn} onChange={(e) => setF({ ...f, nameEn: e.target.value })} />
        </Field>
      </div>
      <Field label="Слаг" strong>
        <TextInput
          look="plain"
          numeric
          value={f.slug}
          onChange={(e) => {
            setSlugTouched(true);
            setF({ ...f, slug: e.target.value.toLowerCase() });
          }}
        />
      </Field>
      <Field label="Описание" strong>
        <TextArea look="plain" value={f.descriptionRu} onChange={(e) => setF({ ...f, descriptionRu: e.target.value })} placeholder="Показывается на странице категории" />
      </Field>
      {save.error && <div className="rounded-xl bg-red-50 px-3.5 py-2.5 text-xs text-red-600">{save.error.message}</div>}
      <ModalActions>
        <Button size="xl" onClick={onClose}>
          Отмена
        </Button>
        <Button size="xl" variant="primary" disabled={!f.nameRu.trim() || !f.slug.trim() || save.isPending} onClick={() => save.mutate({ id: row?.id, ...f }, { onSuccess: onClose })}>
          Сохранить
        </Button>
      </ModalActions>
    </Modal>
  );
}

function AuthorModal({ row, onClose }: { row: BlogAuthor | null; onClose: () => void }) {
  const save = useSaveDict<BlogAuthor>("authors");
  const upload = useUploadImage();
  const [f, setF] = useState({ name: row?.name ?? "", bioRu: row?.bioRu ?? "", avatarUrl: row?.avatarUrl ?? "" });
  return (
    <Modal open onClose={onClose} width={520} title={row ? `Автор · ${row.name}` : "Новый автор"}>
      <div className="flex items-center gap-3">
        {f.avatarUrl ? <img src={f.avatarUrl} alt="" className="size-14 rounded-full object-cover" /> : <Avatar icon="user" size={56} />}
        <label className="cursor-pointer text-[13px] text-brand">
          {upload.isPending ? "Загружаем…" : "Загрузить фото"}
          <input
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) upload.mutate(file, { onSuccess: (url) => setF((x) => ({ ...x, avatarUrl: url })) });
              e.target.value = "";
            }}
          />
        </label>
      </div>
      <Field label="Имя · обязательно" strong>
        <TextInput look="plain" autoFocus value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
      </Field>
      <Field label="О себе" strong>
        <TextArea look="plain" value={f.bioRu} onChange={(e) => setF({ ...f, bioRu: e.target.value })} />
      </Field>
      {(save.error ?? upload.error) && <div className="rounded-xl bg-red-50 px-3.5 py-2.5 text-xs text-red-600">{(save.error ?? upload.error)?.message}</div>}
      <ModalActions>
        <Button size="xl" onClick={onClose}>
          Отмена
        </Button>
        <Button size="xl" variant="primary" disabled={!f.name.trim() || save.isPending} onClick={() => save.mutate({ id: row?.id, ...f }, { onSuccess: onClose })}>
          Сохранить
        </Button>
      </ModalActions>
    </Modal>
  );
}

function TagModal({ onClose }: { onClose: () => void }) {
  const save = useSaveDict<BlogTag>("tags");
  const [name, setName] = useState("");
  return (
    <Modal open onClose={onClose} width={440} title="Новый тег">
      <Field label="Название" strong>
        <TextInput look="plain" autoFocus value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <div className="font-num text-xs text-neutral-400">слаг: {slugify(name, 100) || "—"}</div>
      {save.error && <div className="rounded-xl bg-red-50 px-3.5 py-2.5 text-xs text-red-600">{save.error.message}</div>}
      <ModalActions>
        <Button size="xl" onClick={onClose}>
          Отмена
        </Button>
        <Button size="xl" variant="primary" disabled={!slugify(name) || save.isPending} onClick={() => save.mutate({ nameRu: name.trim(), slug: slugify(name, 100) }, { onSuccess: onClose })}>
          Создать
        </Button>
      </ModalActions>
    </Modal>
  );
}
