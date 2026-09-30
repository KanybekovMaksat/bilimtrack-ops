import { useState } from "react";
import { useNavigate } from "react-router";
import { ARTICLE_STATUS, categoryTone, useArticleAction, useArticles, useCategories, type ArticleRow, type ArticleStatus } from "@/entities/article";
import { routes } from "@/shared/config";
import { formatDate, formatInt, useUrlFilters, useUrlSearch } from "@/shared/lib";
import { Button, Cell, EmptyState, ErrorNote, FilterSelect, Icon, Modal, ModalActions, PageHeader, Pill, Row, SearchInput, Table, Tabs } from "@/shared/ui";

type Tab = ArticleStatus | "all";
const TABS: Tab[] = ["all", "draft", "published", "archived"];

export function PostsPage() {
  const articles = useArticles();
  const categories = useCategories().data ?? [];
  const action = useArticleAction();
  const navigate = useNavigate();
  const f = useUrlFilters();
  const [query, setQuery] = useUrlSearch(f, 250);
  const tab = f.oneOf("tab", TABS) ?? "all";
  const category = f.get("category");
  const [deleting, setDeleting] = useState<ArticleRow | null>(null);

  const count = (s: ArticleStatus) => articles.filter((a) => a.status === s).length;
  const q = query.trim().toLowerCase();
  const rows = articles
    .filter((a) => tab === "all" || a.status === tab)
    .filter((a) => !category || a.category === category)
    .filter((a) => !q || `${a.titleRu} ${a.slug} ${a.authorName}`.toLowerCase().includes(q));

  return (
    <div className="flex max-w-[1200px] flex-col gap-4">
      <PageHeader
        title="Статьи"
        subtitle={`блог bilimtrack.kg · ${formatInt(articles.reduce((a, x) => a + x.viewsCount, 0))} просмотров`}
        actions={
          <Button variant="primary" icon="pencil" onClick={() => navigate(routes.postEditor)}>
            Новая статья
          </Button>
        }
      />
      <Tabs<Tab>
        value={tab}
        onChange={(k) => f.set({ tab: k === "all" ? undefined : k })}
        items={[
          { key: "all", label: "Все", count: articles.length },
          { key: "draft", label: "Черновики", count: count("draft") },
          { key: "published", label: "Опубликованные", count: count("published") },
          { key: "archived", label: "Архив", count: count("archived") },
        ]}
      />
      <div className="flex flex-wrap items-center gap-2">
        <SearchInput placeholder="Заголовок, слаг, автор" value={query} onChange={setQuery} />
        <FilterSelect
          label="Категория"
          allLabel="Все категории"
          value={category}
          onChange={(v) => f.set({ category: v })}
          options={categories.map((c) => ({ value: c.id, label: c.nameRu }))}
        />
      </div>
      <ErrorNote error={action.error} />
      {rows.length ? (
        <Table cols="96px minmax(260px,1fr) 150px 140px 120px 90px 130px 104px" minWidth={1100} head={["Обложка", "Заголовок", "Категория", "Автор", "Публикация", "Просмотры", "Статус", ""]}>
          {rows.map((a) => {
            const tone = categoryTone(categories, a.category);
            return (
              <Row key={a.id} onClick={() => navigate(routes.postEdit(a.id))}>
                <span className="block aspect-video w-[84px] overflow-hidden rounded-lg border border-neutral-100 bg-neutral-100">
                  {a.coverImageUrl ? (
                    <img src={a.coverImageUrl} alt="" loading="lazy" className="size-full object-cover" />
                  ) : (
                    <span className="flex size-full items-center justify-center text-neutral-300">
                      <Icon name="photo" size={18} />
                    </span>
                  )}
                </span>
                <span className="min-w-0">
                  <Cell className="block font-medium">
                    {a.isFeatured && <Icon name="sparkles" size={13} className="mr-1 text-amber-500" />}
                    {a.titleRu}
                  </Cell>
                  <Cell className="block font-num text-[11px] text-neutral-400">/blog/{a.slug}</Cell>
                </span>
                <span>
                  <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold" style={{ background: tone.bg, color: tone.fg }}>
                    {a.categoryName}
                  </span>
                </span>
                <Cell className="text-xs text-neutral-600">{a.authorName}</Cell>
                <span className="text-xs text-neutral-500">{formatDate(a.publishedAt)}</span>
                <span className="font-num text-xs text-neutral-700">{formatInt(a.viewsCount)}</span>
                <span>
                  <Pill size="sm" tone={ARTICLE_STATUS[a.status].tone}>
                    {ARTICLE_STATUS[a.status].label}
                  </Pill>
                </span>
                <span className="flex justify-end gap-0.5" onClick={(e) => e.stopPropagation()}>
                  {a.status !== "published" && (
                    <Button size="xs" variant="ghost" icon="send" title="Опубликовать" aria-label="Опубликовать" disabled={action.isPending} onClick={() => action.mutate({ id: a.id, action: "publish" })} />
                  )}
                  {a.status === "published" && (
                    <Button size="xs" variant="ghost" icon="archive" title="В архив" aria-label="В архив" disabled={action.isPending} onClick={() => action.mutate({ id: a.id, action: "archive" })} />
                  )}
                  <Button size="xs" variant="ghost" icon="trash" title="Удалить" aria-label="Удалить" onClick={() => setDeleting(a)} />
                </span>
              </Row>
            );
          })}
        </Table>
      ) : (
        <div className="rounded-xl border border-neutral-200">
          <EmptyState
            icon="article"
            title={articles.length ? "По фильтрам ничего не найдено" : "Статей пока нет"}
            action={
              !articles.length && (
                <Button variant="primary" icon="pencil" onClick={() => navigate(routes.postEditor)}>
                  Написать первую
                </Button>
              )
            }
          />
        </div>
      )}
      {deleting && (
        <Modal open onClose={() => setDeleting(null)} width={480} title="Удалить статью?">
          <div className="text-[13px] leading-5 text-neutral-700">«{deleting.titleRu}» исчезнет из блога и из админки. Это нельзя отменить — для снятия с публикации есть архив.</div>
          <ModalActions>
            <Button size="xl" onClick={() => setDeleting(null)}>
              Отмена
            </Button>
            <Button size="xl" variant="danger" disabled={action.isPending} onClick={() => action.mutate({ id: deleting.id, action: "delete" }, { onSuccess: () => setDeleting(null) })}>
              Удалить
            </Button>
          </ModalActions>
        </Modal>
      )}
    </div>
  );
}
