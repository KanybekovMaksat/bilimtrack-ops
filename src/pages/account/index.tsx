import { useParams } from "react-router";
import { useAccount } from "@/entities/account";
import { ImpersonateButton, useImpersonation } from "@/features/impersonate";
import { LinkProfileButton } from "@/features/link-profile";
import { routes } from "@/shared/config";
import { Avatar, Breadcrumbs, Callout, Card, OrgMark, Pill } from "@/shared/ui";

export function AccountPage() {
  const { login = "a.kaliyeva" } = useParams();
  const { account, linked, memberships, profiles } = useAccount(login);
  const ended = useImpersonation((s) => s.ended);

  return (
    <div className="flex max-w-[900px] flex-col gap-4">
      <Breadcrumbs items={[{ label: "Поиск аккаунтов", to: routes.accounts }, { label: login }]} />
      {linked && (
        <Callout tone="success" icon="circle-check" className="text-[13px]">
          Профиль «{account.name}» привязан к аккаунту. Членство в МУИТ восстановлено, роль «Учащийся». Пароль не изменён.
        </Callout>
      )}
      {ended && (
        <Callout tone="mutedBorder" icon="history" iconClassName="text-neutral-500" className="text-[13px]">
          Сеанс от имени {account.login} завершён в 14:26. Запись с причиной и открытыми страницами добавлена в журнал аудита.
        </Callout>
      )}
      <div className="flex items-start gap-4">
        <Avatar initials={account.initials} size={52} className="text-[17px]" />
        <div className="flex-1">
          <div className="flex items-center gap-2.5">
            <h1 className="m-0 font-num text-xl leading-[26px] font-semibold">{account.login}</h1>
            <Pill tone="success">{account.status}</Pill>
          </div>
          <div className="mt-1 text-[13px] text-neutral-500">
            {account.name} · {account.email} · {account.phone} · последний вход {account.lastLogin}
          </div>
        </div>
        <ImpersonateButton target={{ login: account.login, name: account.name, org: "МУИТ", role: "Учащийся" }} />
        {!linked && <LinkProfileButton account={account} />}
      </div>
      <Callout tone="muted" icon="shield-lock" iconClassName="text-neutral-400" className="text-neutral-500">
        Панель не показывает пароли. Вход от имени пользователя — только с указанием причины, сеанс записывается в журнал аудита.
      </Callout>
      <div className="grid grid-cols-2 items-start gap-4">
        <Card className="overflow-hidden">
          <div className="border-b border-neutral-100 px-4 py-[13px] text-sm font-medium">Членства</div>
          {memberships.map((m) => (
            <div key={m.org} className="flex items-center gap-2.5 border-b border-neutral-50 px-4 py-3 last:border-b-0">
              <OrgMark short={m.orgShort} size={24} />
              <div className="flex-1">
                <div className="text-[13px] font-medium">{m.org}</div>
                <div className="text-[11px] text-neutral-400">{m.roles}</div>
              </div>
              {m.main && (
                <Pill tone="info" size="sm" className="font-normal">
                  основная
                </Pill>
              )}
              <Pill size="sm" tone={m.status === "Активно" ? "success" : "neutral"}>
                {m.status}
              </Pill>
            </div>
          ))}
        </Card>
        <Card className="overflow-hidden">
          <div className="border-b border-neutral-100 px-4 py-[13px] text-sm font-medium">Профили</div>
          {profiles.map((p) => (
            <div key={p.org} className="flex items-center gap-2.5 border-b border-neutral-50 px-4 py-3 last:border-b-0">
              <OrgMark short={p.orgShort} size={24} />
              <div className="flex-1">
                <div className="text-[13px]">{p.org}</div>
                <div className="text-[11px] text-neutral-400">{p.type}</div>
              </div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
