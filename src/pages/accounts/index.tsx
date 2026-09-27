import { Suspense, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { SEARCH_HINTS, useAccountSearch } from "@/entities/account";
import { routes } from "@/shared/config";
import { cn } from "@/shared/lib";
import { Avatar, Button, EmptyState, Icon, OrgMark, Pill } from "@/shared/ui";

export function AccountsPage() {
  const [params, setParams] = useSearchParams();
  const submitted = params.get("q") ?? "";
  const [query, setQuery] = useState(submitted);

  const search = (q: string) => {
    setQuery(q);
    if (q.trim()) setParams({ q: q.trim() });
  };

  return (
    <div className="mx-auto flex max-w-[900px] flex-col gap-5 pt-3">
      <div>
        <h1 className="m-0 mb-1 text-xl leading-[26px] font-semibold tracking-[-.01em]">Поиск аккаунтов</h1>
        <div className="text-[13px] text-neutral-500">Имя, логин, почта или телефон — по всем организациям</div>
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
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="+7 707 214 88 03"
            className="flex-1 border-0 bg-transparent font-sans text-[15px] outline-none"
          />
        </label>
        <Button type="submit" variant="primary" className="h-12 px-6 text-[15px]">
          Найти
        </Button>
      </form>

      {submitted ? (
        <Suspense fallback={<div className="h-40 animate-pulse rounded-2xl bg-neutral-50" />}>
          <Results query={submitted} />
        </Suspense>
      ) : (
        <EmptyState
          dashed
          icon="user-search"
          title="Введите запрос, чтобы начать"
          description="Ищем по имени, логину, почте и телефону. Телефон можно в любом формате — с плюсом, пробелами или без."
          action={
            <div className="flex flex-wrap justify-center gap-1.5">
              {SEARCH_HINTS.map((h) => (
                <Button key={h} size="xs" className="font-normal text-neutral-700" onClick={() => search(h)}>
                  {h}
                </Button>
              ))}
            </div>
          }
        />
      )}
    </div>
  );
}

function Results({ query }: { query: string }) {
  const { accounts, profiles } = useAccountSearch(query);
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-[18px]">
      <div>
        <div className="mb-2 flex items-center gap-2">
          <span className="text-[13px] font-semibold">Аккаунты</span>
          <span className="text-xs text-neutral-400">записи для входа · {accounts.length}</span>
        </div>
        {accounts.map((a) => (
          <div
            key={a.login}
            onClick={() => navigate(routes.account(a.login))}
            className="flex cursor-pointer items-center gap-3.5 rounded-[14px] border border-neutral-200 p-3.5 hover:bg-neutral-50"
          >
            <Avatar icon="key" size={38} tone="brand" />
            <div className="min-w-0 flex-1">
              <div className="font-num text-sm font-medium">{a.login}</div>
              <div className="text-xs text-neutral-500">
                {a.name} · {a.email} · {a.phone}
              </div>
            </div>
            <Pill tone="success">{a.status}</Pill>
            <span className="text-[11px] text-neutral-400">вход {a.lastLogin}</span>
            <Icon name="chevron-right" size={18} className="text-neutral-300" />
          </div>
        ))}
      </div>
      <div>
        <div className="mb-2 flex items-center gap-2">
          <span className="text-[13px] font-semibold">Профили</span>
          <span className="text-xs text-neutral-400">человек в организации · {profiles.length}</span>
        </div>
        <div className="flex flex-col gap-2">
          {profiles.map((p) => (
            <div key={p.org} className={cn("flex items-center gap-3.5 rounded-[14px] border p-3.5", p.account ? "border-neutral-200" : "border-amber-500")}>
              <Avatar icon="user" size={38} />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium">{p.name}</div>
                <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                  {p.type} ·
                  <span className="inline-flex items-center gap-[5px]">
                    <OrgMark short={p.orgShort} size={16} />
                    {p.org}
                  </span>
                </div>
              </div>
              <Pill size="lg" tone={p.account ? "neutral" : "warn"}>
                {p.account ?? "Нет аккаунта"}
              </Pill>
            </div>
          ))}
        </div>
        <p className="mt-2.5 mb-0 text-xs leading-[18px] text-neutral-400">
          Профиль без аккаунта — типичная причина «не могу зайти». Он подсвечен рамкой и отдельной пометкой: привязка делается из карточки аккаунта.
        </p>
      </div>
    </div>
  );
}
