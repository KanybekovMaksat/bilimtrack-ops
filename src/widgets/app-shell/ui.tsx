import { Suspense, useEffect, useRef, useState } from "react";
import { QueryErrorResetBoundary } from "@tanstack/react-query";
import { Link, Outlet, useLocation, useNavigate } from "react-router";
import { useLeadsSoft } from "@/entities/lead";
import { useCan, useSession } from "@/entities/session";
import { isOpen, useTicketsSoft } from "@/entities/ticket";
import logoMark from "@/shared/assets/logo-mark.svg";
import { routes } from "@/shared/config";
import { cn } from "@/shared/lib";
import { ErrorBoundary, Icon, type IconName, PageSkeleton, UserAvatar } from "@/shared/ui";
import { NAV, isActive } from "./nav";

/** Bilimtrack puzzle mark — the same asset as the blog and design system. */
export function Logo({ size = 30 }: { size?: number }) {
  return <img src={logoMark} alt="Bilimtrack" width={size} height={size} className="shrink-0" />;
}

/** Live counters: open tickets and new demo requests, fetched only with the privilege to see them. */
function useCounters() {
  const can = useCan();
  const tickets = useTicketsSoft({ enabled: can("support") });
  const leads = useLeadsSoft({ enabled: can("sales") });
  return {
    tickets: tickets.data?.filter(isOpen).length,
    leads: leads.data?.filter((l) => l.status === "new").length,
  };
}

function Sidebar() {
  const { pathname } = useLocation();
  const counters = useCounters();
  const can = useCan();
  const groups = NAV.map((g) => ({ ...g, items: g.items.filter((it) => can(it.perm)) })).filter((g) => g.items.length);

  return (
    <aside className="sticky top-0 flex h-screen w-[252px] shrink-0 flex-col gap-1 overflow-auto border-r border-neutral-100 px-3 py-3.5">
      <Link to={routes.home} className="flex items-center gap-2.5 px-2 pt-1 pb-3.5 text-ink hover:text-ink">
        <Logo />
        <div className="text-[15px] font-semibold">Bilimtrack Ops</div>
      </Link>
      {groups.map((g) => (
        <div key={g.title || "root"} className="mb-2.5 flex flex-col gap-px">
          {g.title && <div className="px-2.5 py-1 text-[10px] font-semibold tracking-[.06em] text-neutral-400 uppercase">{g.title}</div>}
          {g.items.map((it) => {
            const on = isActive(it, pathname);
            return (
              <Link
                key={it.to}
                to={it.to}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-sm leading-[18px] hover:bg-neutral-100",
                  on ? "bg-neutral-100 font-medium text-brand hover:text-brand" : "text-ink hover:text-ink",
                )}
              >
                <Icon name={it.icon} size={18} className={on ? "text-brand" : "text-neutral-400"} />
                <span className="flex-1">{it.label}</span>
                {it.counter && counters[it.counter] ? (
                  <span className="rounded-full bg-neutral-100 px-[7px] py-px text-[11px] font-semibold text-neutral-500">{counters[it.counter]}</span>
                ) : null}
                {it.demo && (
                  <span title="Бэкенда пока нет — экран на демо-данных" className="rounded-full border border-dashed border-neutral-300 px-1.5 text-[10px] text-neutral-400">
                    демо
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      ))}
    </aside>
  );
}

function HeaderBadge({ to, icon, count, tone, title }: { to: string; icon: IconName; count?: number; tone: "red" | "blue"; title: string }) {
  return (
    <Link to={to} title={title} className="relative flex size-[34px] items-center justify-center rounded-full text-ink hover:bg-neutral-100 hover:text-ink">
      <Icon name={icon} size={19} />
      {count ? (
        <span
          className={cn(
            "absolute top-px right-0 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold text-white",
            tone === "red" ? "bg-red-500" : "bg-brand",
          )}
        >
          {count}
        </span>
      ) : null}
    </Link>
  );
}

function UserMenu() {
  const user = useSession((s) => s.user);
  const signOut = useSession((s) => s.signOut);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((v) => !v)} className="flex items-center gap-[9px] border-0 bg-transparent p-0 text-left">
        <UserAvatar src={user?.avatar} initials={user?.initials ?? "?"} size={30} className="text-xs" />
        <div className="leading-[1.2]">
          <div className="text-[13px] font-medium">{user?.fullName || user?.username}</div>
          <div className="text-[11px] text-neutral-400">{user?.role}</div>
        </div>
        <Icon name="chevron-down" size={15} className="text-neutral-400" />
      </button>
      {open && (
        <div className="absolute top-10 right-0 z-30 w-48 rounded-xl border border-neutral-200 bg-white p-1 shadow-pop">
          <div className="px-3 py-2 font-num text-xs text-neutral-500">{user?.username}</div>
          <Link
            to={routes.profile}
            onClick={() => setOpen(false)}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[13px] text-ink hover:bg-neutral-100 hover:text-ink"
          >
            <Icon name="user" size={16} className="text-neutral-500" />
            Мой профиль
          </Link>
          <button onClick={() => signOut()} className="flex w-full items-center gap-2 rounded-lg border-0 bg-transparent px-3 py-2 text-left text-[13px] hover:bg-neutral-100">
            <Icon name="logout" size={16} className="text-neutral-500" />
            Выйти
          </button>
        </div>
      )}
    </div>
  );
}

function GlobalSearch() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (q.trim()) navigate(`${routes.accounts}?q=${encodeURIComponent(q.trim())}`);
      }}
      className="flex h-9 max-w-[520px] flex-1 items-center gap-2 rounded-full bg-neutral-100 px-3.5 text-sm"
    >
      <Icon name="search" size={17} className="text-neutral-400" />
      <input
        ref={inputRef}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Поиск аккаунта: логин, почта, телефон или ФИО"
        className="min-w-0 flex-1 border-0 bg-transparent font-sans text-sm outline-none placeholder:text-neutral-400"
      />
      <span className="rounded-md border border-neutral-200 bg-white px-1.5 py-px text-[11px] text-neutral-500">⌘K</span>
    </form>
  );
}

/** Sidebar + sticky header + page outlet; one Suspense + error boundary for every page query. */
export function AppShell() {
  const { pathname } = useLocation();
  const counters = useCounters();
  const can = useCan();
  return (
    <div className="flex min-h-screen min-w-[1280px] bg-white">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-4 border-b border-neutral-100 bg-white px-6">
          <GlobalSearch />
          <div className="flex-1" />
          <div className="flex items-center gap-1.5">
            {can("support") && <HeaderBadge to={routes.tickets} icon="lifebuoy" count={counters.tickets} tone="red" title="Открытые тикеты" />}
            {can("sales") && <HeaderBadge to={routes.leads} icon="inbox" count={counters.leads} tone="blue" title="Новые заявки на демо" />}
          </div>
          <div className="h-6 w-px bg-neutral-200" />
          <UserMenu />
        </header>
        <main className="min-w-0 flex-1 px-7 pt-6 pb-14">
          <QueryErrorResetBoundary>
            {({ reset }) => (
              <ErrorBoundary key={pathname} onReset={reset}>
                <Suspense fallback={<PageSkeleton />}>
                  <Outlet />
                </Suspense>
              </ErrorBoundary>
            )}
          </QueryErrorResetBoundary>
        </main>
      </div>
    </div>
  );
}
