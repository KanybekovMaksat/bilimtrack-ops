import { Link, useParams } from "react-router";
import { accountName, formatLastLogin, profileTypeLabel, statusLabel, useAccount } from "@/entities/account";
import { useCan } from "@/entities/session";
import { LinkProfileButton } from "@/features/link-profile";
import { routes } from "@/shared/config";
import { formatDate, initialsOf, orgShort } from "@/shared/lib";
import { Avatar, Breadcrumbs, Callout, Card, EmptyState, KV, OrgMark, Pill } from "@/shared/ui";
import { UserActivityCard } from "@/widgets/activity-report";

export function AccountPage() {
  const { login = "" } = useParams();
  const account = useAccount(login);
  const can = useCan();

  if (!account) {
    return <EmptyState icon="user-search" title="Аккаунт не найден" description={`Логина «${login}» нет в системе.`} />;
  }

  const name = accountName(account);

  return (
    <div className="flex max-w-[960px] flex-col gap-4">
      <Breadcrumbs items={[{ label: "Аккаунты", to: routes.accounts }, { label: account.username }]} />
      <div className="flex items-start gap-4">
        <Avatar initials={initialsOf(name || account.username)} size={52} tone={account.operator ? "brand" : "neutral"} className="text-[17px]" />
        <div className="flex-1">
          <div className="flex items-center gap-2.5">
            <h1 className="m-0 font-num text-xl leading-[26px] font-semibold">{account.username}</h1>
            <Pill tone={account.isActive ? "success" : "neutral"}>{account.isActive ? "Активен" : "Отключён"}</Pill>
            {account.operator && <Pill tone="info">{account.operator.roleLabel}</Pill>}
          </div>
          <div className="mt-1 text-[13px] text-neutral-500">
            {[name, account.email, account.phone, `последний вход ${formatLastLogin(account.lastLogin)}`].filter(Boolean).join(" · ")}
          </div>
        </div>
        {!account.operator && <LinkProfileButton account={account} />}
      </div>

      <Callout tone="muted" icon="shield-lock" iconClassName="text-neutral-400" className="text-neutral-500">
        Панель не показывает пароли. Привязка профиля не меняет пароль — если человек его не помнит, нужен отдельный сброс.
      </Callout>

      <Card className="grid grid-cols-2 gap-x-6 gap-y-2.5 p-4">
        <KV k="Создан" width={150}>
          {formatDate(account.dateJoined)}
        </KV>
        <KV k="Последний вход" width={150}>
          {formatLastLogin(account.lastLogin)}
        </KV>
        <KV k="Почта подтверждена" width={150}>
          {account.emailVerifiedAt ? formatDate(account.emailVerifiedAt) : <span className="text-neutral-400">нет</span>}
        </KV>
        <KV k="Пароль изменён" width={150}>
          {account.passwordChangedAt ? formatDate(account.passwordChangedAt) : <span className="text-neutral-400">не менялся</span>}
        </KV>
        <KV k="Временный пароль" width={150}>
          {account.mustChangePassword ? <span className="text-warn">да — сменит при входе</span> : "нет"}
        </KV>
      </Card>

      <div className="grid grid-cols-2 items-start gap-4">
        <Card className="overflow-hidden">
          <div className="border-b border-neutral-100 px-4 py-[13px] text-sm font-medium">Членства</div>
          {account.memberships.length ? (
            account.memberships.map((m) => (
              <div key={m.id} className="flex items-center gap-2.5 border-b border-neutral-50 px-4 py-3 last:border-b-0">
                <OrgMark short={orgShort(m.organization.name)} size={24} />
                <div className="min-w-0 flex-1">
                  <Link to={routes.org(m.organization.id)} className="text-[13px] font-medium">
                    {m.organization.name}
                  </Link>
                  <div className="text-[11px] text-neutral-400">{m.roles.map((r) => r.name).join(", ") || "без ролей"}</div>
                </div>
                {m.isDefault && (
                  <Pill tone="info" size="sm" className="font-normal">
                    основная
                  </Pill>
                )}
                <Pill size="sm" tone={m.status === "active" ? "success" : "neutral"}>
                  {statusLabel(m.status)}
                </Pill>
              </div>
            ))
          ) : (
            <div className="px-4 py-6 text-center text-[13px] text-neutral-400">
              {account.operator ? "Команда Bilimtrack не привязана к организациям" : "Нет членств ни в одной организации"}
            </div>
          )}
        </Card>
        <Card className="overflow-hidden">
          <div className="border-b border-neutral-100 px-4 py-[13px] text-sm font-medium">Профили</div>
          {account.profiles.length ? (
            account.profiles.map((p) => (
              <div key={`${p.profileType}-${p.id}`} className="flex items-center gap-2.5 border-b border-neutral-50 px-4 py-3 last:border-b-0">
                <OrgMark short={orgShort(p.organization.name)} size={24} />
                <div className="min-w-0 flex-1">
                  <div className="text-[13px]">{p.fullName}</div>
                  <div className="text-[11px] text-neutral-400">
                    {profileTypeLabel[p.profileType]} · {p.organization.name}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="px-4 py-6 text-center text-[13px] text-neutral-400">Профилей нет</div>
          )}
        </Card>
      </div>

      {can("analytics") && !account.operator && <UserActivityCard userId={account.id} />}
    </div>
  );
}
