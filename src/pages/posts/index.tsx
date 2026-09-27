import { useState } from "react";
import { useNavigate } from "react-router";
import { articleTone, useArticles } from "@/entities/article";
import { routes } from "@/shared/config";
import { Button, Cell, FilterChip, Icon, PageHeader, Pill, Row, SearchInput, Table, Tabs } from "@/shared/ui";

type Tab = "drafts" | "pub" | "all";

export function PostsPage() {
  const articles = useArticles();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("all");
  const [query, setQuery] = useState("");

  const rows = articles
    .filter((a) => (tab === "drafts" ? a.status === "Черновик" : tab === "pub" ? a.status === "Опубликовано" : true))
    .filter((a) => a.title.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <div className="flex max-w-[1120px] flex-col gap-4">
      <PageHeader
        title="Статьи"
        subtitle="блог bilimtrack.kg"
        actions={
          <Button variant="primary" icon="plus" onClick={() => navigate(routes.postEditor)}>
            Новая статья
          </Button>
        }
      />
      <Tabs
        value={tab}
        onChange={setTab}
        items={[
          { key: "drafts", label: "Черновики", count: articles.filter((a) => a.status === "Черновик").length },
          { key: "pub", label: "Опубликованные", count: articles.filter((a) => a.status === "Опубликовано").length },
          { key: "all", label: "Все", count: articles.length },
        ]}
      />
      <div className="flex gap-2">
        <SearchInput placeholder="Заголовок" value={query} onChange={setQuery} />
        {["Категория", "Автор", "Период"].map((f) => (
          <FilterChip key={f} label={f} />
        ))}
      </div>
      <Table
        cols="minmax(260px,1fr) 130px 120px 130px 100px 150px 130px"
        minWidth={940}
        head={["Заголовок", "Автор", "Категория", "Публикация", "Просмотры", "Заявки со статьи", "Статус"]}
      >
        {rows.map((a) => (
          <Row key={a.title} onClick={() => navigate(routes.postEditor)}>
            <Cell className="font-medium">{a.title}</Cell>
            <span className="text-xs text-brand">{a.author}</span>
            <span className="text-xs text-neutral-500">{a.category}</span>
            <span className="text-xs text-neutral-500">{a.date}</span>
            <span className="font-num text-xs text-neutral-700">{a.views}</span>
            <span
              onClick={(e) => {
                if (!a.leads) return;
                e.stopPropagation();
                navigate(routes.leads);
              }}
              className={`flex items-center gap-[5px] font-num text-[13px] ${a.leads ? "font-semibold text-brand" : "text-neutral-400"}`}
            >
              {a.leads}
              <Icon name="arrow-up-right" size={14} />
            </span>
            <span>
              <Pill tone={articleTone[a.status]}>{a.status}</Pill>
            </span>
          </Row>
        ))}
      </Table>
      <p className="m-0 text-xs text-neutral-400">«Заявки со статьи» — единственная связь контента с продажами. Клик ведёт в заявки с фильтром по этой статье.</p>
    </div>
  );
}
