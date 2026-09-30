import { useModerationReports, type ModerationQuery } from "@/entities/moderation";
import { useOrganizationsSoft } from "@/entities/organization";
import { useUrlFilters, useUrlSearch } from "@/shared/lib";
import { Button, Callout, Drawer, FilterSelect, Icon, PageHeader, SearchInput, Tabs } from "@/shared/ui";
import { PLACEHOLDER, STATUS_OPTIONS, type Tab } from "./lib";
import { PostsPanel } from "./ui/posts-panel";
import { CommentsPanel } from "./ui/comments-panel";
import { ChatConversation, ChatsPanel } from "./ui/chats";
import { ReportsPanel } from "./ui/reports-panel";
import { UserDrawer } from "./ui/user-drawer";

export function ModerationPage() {
  const f = useUrlFilters();
  const orgs = useOrganizationsSoft().data ?? [];
  const tab = f.oneOf<Tab>("tab", ["posts", "comments", "chats", "reports"]) ?? "reports";
  const [search, setSearch] = useUrlSearch(f, 400);
  const page = f.num("page") ?? 1;
  const chatId = f.num("chat");
  const userId = f.num("user");
  const q = f.get("q");

  const person = f.num("person");
  const query: ModerationQuery = {
    q: tab === "reports" ? undefined : q,
    status: f.get("status"),
    type: tab === "chats" ? f.get("type") : undefined,
    organizationId: f.num("org"),
    ...(tab === "chats" ? { participantId: person } : tab === "reports" ? { reportedUserId: person } : { authorId: person }),
    postId: tab === "comments" ? f.num("post") : undefined,
  };
  const onPage = (p: number) => f.set({ page: p });
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
          <FilterSelect label="Статус" allLabel="Любой статус" value={f.get("status")} onChange={(v) => f.set({ status: v })} options={STATUS_OPTIONS[tab]} />
        )}
        {tab === "chats" && (
          <FilterSelect
            label="Тип"
            allLabel="Все чаты"
            value={f.get("type")}
            onChange={(v) => f.set({ type: v })}
            options={[
              { value: "direct", label: "Личные" },
              { value: "group", label: "Чаты предметов" },
            ]}
          />
        )}
        <FilterSelect
          label="Организация"
          allLabel="Все организации"
          searchPlaceholder="Название организации"
          menuWidth={340}
          value={f.get("org")}
          onChange={(v) => f.set({ org: v })}
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
