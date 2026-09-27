import { useState } from "react";
import { useModerationReports, type ModerationQuery } from "@/entities/moderation";
import { useOrganizationsSoft } from "@/entities/organization";
import { useDebouncedEffect } from "@/shared/lib";
import { Button, Callout, Drawer, Icon, PageHeader, SearchInput, SelectInput, Tabs } from "@/shared/ui";
import { PLACEHOLDER, STATUS_OPTIONS, num, useFilters, type Tab } from "./lib";
import { PostsPanel } from "./ui/posts-panel";
import { CommentsPanel } from "./ui/comments-panel";
import { ChatConversation, ChatsPanel } from "./ui/chats";
import { ReportsPanel } from "./ui/reports-panel";
import { UserDrawer } from "./ui/user-drawer";

export function ModerationPage() {
  const f = useFilters();
  const orgs = useOrganizationsSoft().data ?? [];
  const tab: Tab = (["posts", "comments", "chats", "reports"] as Tab[]).includes(f.get("tab") as Tab) ? (f.get("tab") as Tab) : "reports";
  const [search, setSearch] = useState(f.get("q") ?? "");
  const page = num(f.get("page")) ?? 1;
  const chatId = num(f.get("chat"));
  const userId = num(f.get("user"));
  const q = f.get("q");

  // The box follows the URL when it changes from outside (tab switch, filter reset).
  const [shownQ, setShownQ] = useState(q);
  if (shownQ !== q) {
    setShownQ(q);
    setSearch(q ?? "");
  }
  useDebouncedEffect(search.trim(), 400, (next) => {
    if (next !== (q ?? "")) f.set({ q: next || undefined });
  });

  const person = f.get("person");
  const query: ModerationQuery = {
    q: tab === "reports" ? undefined : q,
    status: f.get("status"),
    type: tab === "chats" ? f.get("type") : undefined,
    organizationId: num(f.get("org")),
    ...(tab === "chats" ? { participantId: num(person) } : tab === "reports" ? { reportedUserId: num(person) } : { authorId: num(person) }),
    postId: tab === "comments" ? num(f.get("post")) : undefined,
  };
  const onPage = (p: number) => f.set({ page: String(p) });
  const openReports = useModerationReports({ status: "open", page: 1 });

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Модерация" subtitle="жалобы, посты, комментарии и чаты всех организаций" />
      <Callout tone="mutedBorder" icon="history" iconClassName="text-neutral-400">
        Скрытие, удаление и каждое открытие переписки записываются в журнал действий организации.
      </Callout>
      <Tabs<Tab>
        value={tab}
        onChange={(k) => f.set({ tab: k, status: undefined, type: undefined, q: undefined, post: undefined })}
        items={[
          { key: "reports", label: "Жалобы", count: openReports.data?.count || undefined },
          { key: "posts", label: "Посты" },
          { key: "comments", label: "Комментарии" },
          { key: "chats", label: "Чаты" },
        ]}
      />
      <div className="flex flex-wrap items-center gap-2">
        {tab !== "reports" && <SearchInput width={280} placeholder={PLACEHOLDER[tab]} value={search} onChange={setSearch} />}
        {STATUS_OPTIONS[tab].length > 0 && (
          <SelectInput className="w-[200px]" placeholder="Статус: все" value={f.get("status") ?? ""} onChange={(e) => f.set({ status: e.target.value || undefined })} options={STATUS_OPTIONS[tab]} />
        )}
        {tab === "chats" && (
          <SelectInput
            className="w-[180px]"
            placeholder="Тип: все"
            value={f.get("type") ?? ""}
            onChange={(e) => f.set({ type: e.target.value || undefined })}
            options={[
              { value: "direct", label: "Личные" },
              { value: "group", label: "Чаты предметов" },
            ]}
          />
        )}
        <SelectInput
          className="w-[220px]"
          placeholder="Все организации"
          value={f.get("org") ?? ""}
          onChange={(e) => f.set({ org: e.target.value || undefined })}
          options={orgs.map((o) => ({ value: String(o.id), label: o.name }))}
        />
        {person && (
          <button onClick={() => f.set({ person: undefined, personName: undefined })} className="flex h-[34px] items-center gap-1.5 rounded-full border border-brand bg-brand-50 px-3 text-[13px] text-brand">
            {tab === "chats" ? "Участник" : "Автор"}: {f.get("personName") || `#${person}`}
            <Icon name="x" size={14} />
          </button>
        )}
        {tab === "comments" && f.get("post") && (
          <button onClick={() => f.set({ post: undefined })} className="flex h-[34px] items-center gap-1.5 rounded-full border border-brand bg-brand-50 px-3 text-[13px] text-brand">
            Пост #{f.get("post")}
            <Icon name="x" size={14} />
          </button>
        )}
      </div>

      {tab === "reports" && <ReportsPanel query={query} page={page} onPage={onPage} />}
      {tab === "posts" && <PostsPanel query={query} page={page} onPage={onPage} />}
      {tab === "comments" && <CommentsPanel query={query} page={page} onPage={onPage} />}
      {tab === "chats" && <ChatsPanel query={query} page={page} onPage={onPage} />}

      {chatId && (
        <Drawer
          open
          onClose={() => f.set({ chat: undefined, page: f.get("page") })}
          header={
            <>
              <div className="flex-1 text-[15px] font-semibold">Переписка</div>
              <Button size="sm" variant="ghost" icon="x" onClick={() => f.set({ chat: undefined, page: f.get("page") })} aria-label="Закрыть" />
            </>
          }
        >
          <ChatConversation key={chatId} chatId={chatId} />
        </Drawer>
      )}
      {userId && <UserDrawer userId={userId} onClose={() => f.set({ user: undefined, page: f.get("page") })} />}
    </div>
  );
}
