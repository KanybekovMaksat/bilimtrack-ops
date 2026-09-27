import { Suspense, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { formatLastLogin, profileTypeLabel, useAccountSearch } from "@/entities/account";
import { routes } from "@/shared/config";
import { cn } from "@/shared/lib";
import { Avatar, Button, EmptyState, Icon, OrgMark, Pill } from "@/shared/ui";

const orgShort = (name: string) => name.replace(/[«»"№\s]/g, "").slice(0, 2).toUpperCase();

export function AccountsPage() {
  const [params, setParams] = useSearchParams();
  const submitted = params.get("q") ?? "";
  const [query, setQuery] = useState(submitted);
  const [prev, setPrev] = useState(submitted);
  // Header search navigates here with a new ?q=: keep the field in sync.
  if (prev !== submitted) {
    setPrev(submitted);
    setQuery(submitted);
  }

  const search = (q: string) => {
    setQuery(q);
    if (q.trim()) setParams({ q: q.trim() });
  };

  return (
    <div className="mx-auto flex max-w-[900px] flex-col gap-5 pt-3">
      <div>
        <h1 className="m-0 mb-1 text-xl leading-[26px] font-semibold tracking-[-.01em]">Поиск аккаунтов</h1>
        <div className="text-[13px] text-neutral-500">Логин, почта, телефон или ФИО — по всем организациям</div>
      </div>
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          search(query);
        }}
      >
        <label className="flex h-12 flex-1 items-center gap-2.5 rounded-full border border-neutral-200 bg-neutral-100 px-[18px]">
          <Icon name="search" size={20} className="text-neutral-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="+996 555 21 40 88" className="flex-1 border-0 bg-transparent font-sans text-[15px] outline-none" />
        </label>
        <Button type="submit" variant="primary" className="h-12 px-6 text-[15px]" disabled={query.trim().length < 2}>
          Найти
        </Button>
      </form>

      {submitted.length >= 2 ? (
        <Suspense fallback={<div className="h-40 animate-pulse rounded-2xl bg-neutral-50" />}>
          <Results query={submitted} />
        </Suspense>
      ) : (
        <EmptyState
          dashed
          icon="user-search"
          title="Введите запрос, чтобы начать"
          description="Ищем по логину, почте, телефону и ФИО в профилях. Нужно минимум 2 символа. Телефон ищется по вхождению — вводите так, как он записан в системе."
        />
      )}
    </div>
  );
}

function Results({ query }: { query: string }) {
  const { accounts, profiles } = useAccountSearch(query);
  const navigate = useNavigate();

  if (!accounts.length && !profiles.length) {
    return <EmptyState dashed icon="user-search" title="Ничего не найдено" description={`По запросу «${query}» нет ни аккаунтов, ни профилей.`} />;
  }

  return (
    <div className="flex flex-col gap-[18px]">
      <div>
        <div className="mb-2 flex items-center gap-2">
          <span className="text-[13px] font-semibold">Аккаунты</span>
          <span className="text-xs text-neutral-400">записи для входа · {accounts.length}</span>
        </div>
        <div className="flex flex-col gap-2">
          {accounts.map((a) => (
            <div
              key={a.id}
              onClick={() => navigate(routes.account(a.username))}
              className="flex cursor-pointer items-center gap-3.5 rounded-[14px] border border-neutral-200 p-3.5 hover:bg-neutral-50"
            >
              <Avatar icon="key" size={38} tone="brand" />
              <div className="min-w-0 flex-1">
                <div className="font-num text-sm font-medium">{a.username}</div>
                <div className="truncate text-xs text-neutral-500">
                  {[a.profiles[0]?.fullName, a.email, a.phone].filter(Boolean).join(" · ") || "нет контактов"}
                </div>
              </div>
              <Pill tone={a.isActive ? "success" : "neutral"}>{a.isActive ? "Активен" : "Отключён"}</Pill>
              <span className="text-[11px] text-neutral-400">вход {formatLastLogin(a.lastLogin)}</span>
              <Icon name="chevron-right" size={18} className="text-neutral-300" />
            </div>
          ))}
          {!accounts.length && <div className="rounded-[14px] border border-dashed border-neutral-200 p-4 text-center text-[13px] text-neutral-500">Аккаунтов не найдено</div>}
        </div>
      </div>
      <div>
        <div className="mb-2 flex items-center gap-2">
          <span className="text-[13px] font-semibold">Профили</span>
          <span className="text-xs text-neutral-400">человек в организации · {profiles.length}</span>
        </div>
        <div className="flex flex-col gap-2">
          {profiles.map((p) => (
            <div key={`${p.profileType}-${p.id}`} className={cn("flex items-center gap-3.5 rounded-[14px] border p-3.5", p.linkedUserId ? "border-neutral-200" : "border-amber-500")}>
              <Avatar icon="user" size={38} />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium">{p.fullName}</div>
                <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                  {profileTypeLabel[p.profileType]} ·
                  <span className="inline-flex items-center gap-[5px]">
                    <OrgMark short={orgShort(p.organization.name)} size={16} />
                    {p.organization.name}
                  </span>
                  {(p.phone || p.email) && <span className="text-neutral-400">· {p.phone || p.email}</span>}
                </div>
              </div>
              <Pill size="lg" tone={p.linkedUserId ? "neutral" : "warn"}>
                {p.linkedUserId ? "Есть аккаунт" : "Нет аккаунта"}
              </Pill>
            </div>
          ))}
        </div>
        <p className="mt-2.5 mb-0 text-xs leading-[18px] text-neutral-400">
          Профиль без аккаунта — типичная причина «не могу зайти». Привязка делается из карточки аккаунта: «Привязать профиль».
        </p>
      </div>
    </div>
  );
}
