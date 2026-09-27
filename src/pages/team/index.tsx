import { useState } from "react";
import { PERMISSION_ICON, usePermissionCatalog, useTeam, type Operator } from "@/entities/operator";
import { useCan, useSession } from "@/entities/session";
import { OperatorFormModal, ResetPasswordModal } from "@/features/manage-operator";
import { formatAgo, formatDate, initialsOf, plural } from "@/shared/lib";
import { Button, Callout, Cell, Icon, Num, PageHeader, Pill, Row, SearchInput, Table, UserAvatar } from "@/shared/ui";

export function TeamPage() {
  const team = useTeam();
  const me = useSession((s) => s.user);
  const can = useCan();
  const catalog = usePermissionCatalog();
  const [editing, setEditing] = useState<Operator | "new" | null>(null);
  const [resetting, setResetting] = useState<Operator | null>(null);
  const [query, setQuery] = useState("");
  const manage = can("team");
  const total = catalog.data?.length ?? 10;
  const labelOf = (code: string) => catalog.data?.find((p) => p.code === code)?.label ?? code;

  const q = query.trim().toLowerCase();
  const rows = team.filter((o) => !q || `${o.fullName} ${o.username} ${o.email}`.toLowerCase().includes(q));
  const active = team.filter((o) => o.isActive).length;

  return (
    <div className="flex max-w-[1180px] flex-col gap-4">
      <PageHeader
        title="Команда"
        subtitle={`администраторы платформы · ${active} ${plural(active, ["активный", "активных", "активных"])} из ${team.length}`}
        actions={
          manage && (
            <Button variant="primary" icon="user-plus" onClick={() => setEditing("new")}>
              Новый администратор
            </Button>
          )
        }
      />
      <div className="flex items-center gap-2">
        <SearchInput placeholder="Имя, логин, почта" value={query} onChange={setQuery} />
      </div>
      <Table
        cols="minmax(230px,1.1fr) 150px minmax(260px,1.4fr) 110px 130px 96px"
        minWidth={1060}
        head={["Администратор", "Логин", "Привилегии", "Доступ", "Последний вход", ""]}
      >
        {rows.map((o) => {
          const full = o.permissions.length >= total;
          return (
            <Row key={o.id} hover className={o.isActive ? undefined : "bg-neutral-50 text-neutral-400"}>
              <span className="flex min-w-0 items-center gap-[9px]">
                <UserAvatar src={o.avatar} initials={initialsOf(o.fullName || o.username)} size={30} className="text-[10px]" />
                <span className="min-w-0">
                  <Cell className="block font-medium">
                    {o.fullName}
                    {o.id === me?.id && <span className="ml-1.5 text-xs font-normal text-neutral-400">вы</span>}
                  </Cell>
                  <Cell className="block text-[11px] text-neutral-400">{o.email || "почта не указана"}</Cell>
                </span>
              </span>
              <Num className="text-neutral-700">{o.username}</Num>
              <span className="flex min-w-0 flex-wrap gap-1">
                {full ? (
                  <Pill size="sm" tone="info" icon="shield-lock">
                    Полный доступ
                  </Pill>
                ) : o.permissions.length ? (
                  o.permissions.map((p) => (
                    <span key={p} title={labelOf(p)} className="flex size-6 items-center justify-center rounded-md bg-brand-50 text-brand">
                      <Icon name={PERMISSION_ICON[p] ?? "key"} size={14} />
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-neutral-400">нет привилегий</span>
                )}
              </span>
              <span className="flex flex-col items-start gap-0.5">
                <Pill size="sm" tone={o.isActive ? "success" : "neutral"}>
                  {o.isActive ? "Открыт" : "Закрыт"}
                </Pill>
                {o.mustChangePassword && <span className="text-[10px] text-warn">временный пароль</span>}
              </span>
              <span className="text-xs text-neutral-500" title={o.lastLogin ? formatDate(o.lastLogin) : undefined}>
                {formatAgo(o.lastLogin)}
              </span>
              <span className="flex justify-end gap-0.5">
                {manage && (
                  <>
                    <Button size="xs" variant="ghost" icon="password" title="Новый временный пароль" aria-label="Сбросить пароль" onClick={() => setResetting(o)} />
                    <Button size="xs" variant="ghost" icon="pencil" title="Изменить" aria-label="Изменить" onClick={() => setEditing(o)} />
                  </>
                )}
              </span>
            </Row>
          );
        })}
      </Table>
      <Callout tone="mutedBorder" icon="info-circle" iconClassName="text-neutral-400">
        Администраторы платформы — сотрудники Bilimtrack. У них нет членства в организациях, доступ к разделам Ops решают привилегии. Раздел «Аккаунты» показывает
        только пользователей организаций. Все изменения команды пишутся в аудит.
      </Callout>
      {editing && <OperatorFormModal operator={editing === "new" ? null : editing} onClose={() => setEditing(null)} />}
      {resetting && <ResetPasswordModal operator={resetting} onClose={() => setResetting(null)} />}
    </div>
  );
}
