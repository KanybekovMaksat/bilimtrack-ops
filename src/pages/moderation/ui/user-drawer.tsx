import { useModerationUser } from "@/entities/moderation";
import { formatDateTimeShort } from "@/shared/lib";
import { Button, Callout, Drawer, Icon, type IconName, Pill } from "@/shared/ui";
import { useFilters, type Tab } from "../lib";

const PROFILE_LABEL = { employee: "Сотрудник", learner: "Студент", guardian: "Представитель" };

export function UserDrawer({ userId, onClose }: { userId: number; onClose: () => void }) {
  const f = useFilters();
  const user = useModerationUser(userId);
  const d = user.data;
  const name = d ? d.account.profiles[0]?.fullName || d.account.username : "Пользователь";
  const show = (tab: Tab) => d && f.set({ tab, person: String(d.account.id), personName: name, user: undefined, chat: undefined, post: undefined, status: undefined, q: undefined });
  return (
    <Drawer
      open
      onClose={onClose}
      header={
        <>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[15px] font-semibold">{name}</div>
            <div className="font-num text-[11px] text-neutral-400">{d ? `${d.account.username} · ID ${d.account.id}` : "Загрузка…"}</div>
          </div>
          <Button size="sm" variant="ghost" icon="x" onClick={onClose} aria-label="Закрыть" />
        </>
      }
    >
      <div className="flex flex-col gap-3.5 p-[18px]">
        {user.isLoading && <div className="h-32 animate-pulse rounded-xl bg-neutral-50" />}
        {user.error && <Callout tone="danger">{user.error.message}</Callout>}
        {d && (
          <>
            <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500">
              <Pill size="sm" tone={d.account.isActive ? "success" : "danger"}>
                {d.account.isActive ? "Активен" : "Заблокирован"}
              </Pill>
              <span>{d.account.email || "почта не указана"}</span>
              <span>{d.account.phone || "телефон не указан"}</span>
              <span>вход: {formatDateTimeShort(d.account.lastLogin)}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  ["posts", "article", d.forumPosts.total, "постов", `скрыто ${d.forumPosts.hidden} · удалено ${d.forumPosts.deleted}`],
                  ["comments", "message-circle", d.forumComments.total, "комментариев", `скрыто ${d.forumComments.hidden} · удалено ${d.forumComments.deleted}`],
                  ["chats", "messages", d.chats.total, "чатов", `сообщений ${d.chats.messagesTotal} · удалено ${d.chats.messagesDeleted}`],
                ] as [Tab, IconName, number, string, string][]
              ).map(([tab, icon, n, label, sub]) => (
                <button key={tab} onClick={() => show(tab)} className="flex flex-col gap-1 rounded-xl border border-neutral-200 bg-white p-3 text-left hover:border-brand">
                  <Icon name={icon} size={17} className="text-neutral-400" />
                  <span className="font-num text-lg font-semibold">{n}</span>
                  <span className="text-xs">{label}</span>
                  <span className="text-[10px] leading-[13px] text-neutral-400">{sub}</span>
                </button>
              ))}
            </div>
            <div className="text-xs font-semibold text-neutral-500">Организации и роли</div>
            {!d.account.memberships.length && <div className="text-xs text-neutral-400">Членств нет</div>}
            {d.account.memberships.map((m) => (
              <div key={m.id} className="flex flex-col gap-1.5 rounded-xl border border-neutral-200 p-3">
                <div className="flex items-center gap-2 text-[13px] font-medium">
                  <Icon name="building" size={15} className="text-neutral-400" />
                  {m.organization.name}
                  {m.status !== "active" && <Pill size="sm">{m.status}</Pill>}
                </div>
                <div className="flex flex-wrap gap-1">
                  {m.roles.map((r) => (
                    <Pill key={r.id} size="sm" tone="info">
                      {r.name}
                    </Pill>
                  ))}
                </div>
                {d.account.profiles
                  .filter((p) => p.organization.id === m.organization.id)
                  .map((p) => (
                    <div key={`${p.profileType}-${p.id}`} className="text-xs text-neutral-500">
                      {p.fullName} · {PROFILE_LABEL[p.profileType]}
                    </div>
                  ))}
              </div>
            ))}
          </>
        )}
      </div>
    </Drawer>
  );
}
