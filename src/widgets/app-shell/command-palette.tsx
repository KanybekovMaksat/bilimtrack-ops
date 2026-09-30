import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router";
import { accountName, useAccounts } from "@/entities/account";
import { useOrganizationsSoft } from "@/entities/organization";
import { formatMoney, paymentStatusLabel, usePayments } from "@/entities/payment";
import { useCan } from "@/entities/session";
import { useTicketList } from "@/entities/ticket";
import { routes } from "@/shared/config";
import { cn, useDebouncedEffect } from "@/shared/lib";
import { Icon, type IconName } from "@/shared/ui";
import { NAV } from "./nav";

type Hit = { key: string; group: string; icon: IconName; title: string; hint?: string; to: string };

const PER_GROUP = 5;

/** Everything the panel can jump to for `q`: sections, organizations, tickets, accounts, payments. */
function useHits(q: string, serverQ: string): { hits: Hit[]; loading: boolean } {
  const can = useCan();
  const orgs = useOrganizationsSoft();
  // Tickets, accounts and payments are too big to keep in the browser: the server searches them, from 2 characters.
  const ask = serverQ.length >= 2;
  const tickets = useTicketList({ q: serverQ, pageSize: PER_GROUP }, { enabled: ask && can("support") });
  const accounts = useAccounts({ q: serverQ, page: 1 }, ask && can("accounts"));
  const payments = usePayments({ q: serverQ, page: 1 }, ask);

  const needle = q.toLowerCase();
  const has = (...parts: (string | null | undefined)[]) => parts.join(" ").toLowerCase().includes(needle);

  const sections: Hit[] = NAV.flatMap((g) => g.items)
    .filter((it) => can(it.perm) && (!needle || has(it.label)))
    .map((it) => ({ key: `nav:${it.to}`, group: "Разделы", icon: it.icon, title: it.label, to: it.to }));
  if (!needle) return { hits: sections, loading: false };

  const found: Hit[] = [
    ...sections.slice(0, PER_GROUP),
    ...(orgs.data ?? [])
      .filter((o) => has(o.name, o.shortName, o.legalName, o.slug))
      .slice(0, PER_GROUP)
      .map((o): Hit => ({ key: `org:${o.id}`, group: "Организации", icon: "building", title: o.name, hint: o.typeLabel, to: routes.org(o.id) })),
    // Rows of the previous query stay on screen while the next one loads; show them only once they match what is typed.
    ...(ask && serverQ === q ? (tickets.data?.rows ?? []) : [])
      .slice(0, PER_GROUP)
      .map((t): Hit => ({ key: `ticket:${t.id}`, group: "Тикеты", icon: "lifebuoy", title: t.subject, hint: `${t.number} · ${t.author}`, to: routes.ticket(t.id) })),
    ...(ask && serverQ === q ? (accounts.data?.rows ?? []) : [])
      .slice(0, PER_GROUP)
      .map((a): Hit => ({ key: `account:${a.id}`, group: "Аккаунты", icon: "key", title: a.username, hint: accountName(a) || a.email || a.phone, to: routes.account(a.username) })),
    ...(ask && serverQ === q ? (payments.data?.rows ?? []) : []).slice(0, 3).map(
      (p): Hit => ({
        key: `payment:${p.id}`,
        group: "Платежи",
        icon: "credit-card",
        title: `${formatMoney(p.amount, p.currency)} · ${p.user.fullName || p.user.username}`,
        hint: `${paymentStatusLabel[p.status] ?? p.status} · ${p.providerTransactionId || p.id}`,
        to: `${routes.payments}?payment=${encodeURIComponent(p.id)}`,
      }),
    ),
  ];
  if (can("accounts") && q.length >= 2) {
    found.push({ key: "all-accounts", group: "Аккаунты", icon: "user-search", title: `Все аккаунты по запросу «${q}»`, to: `${routes.accounts}?q=${encodeURIComponent(q)}` });
  }
  return { hits: found, loading: q.length >= 2 && (serverQ !== q || tickets.isFetching || accounts.isFetching || payments.isFetching) };
}

function Palette({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const [text, setText] = useState("");
  const [serverQ, setServerQ] = useState("");
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const q = text.trim();
  useDebouncedEffect(q, 300, setServerQ);
  const { hits, loading } = useHits(q, serverQ);
  const current = Math.min(active, hits.length - 1);

  useEffect(() => {
    listRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: "nearest" });
  }, [current]);

  const go = (hit: Hit) => {
    onClose();
    navigate(hit.to);
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive(Math.min(hits.length - 1, current + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive(Math.max(0, current - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (hits[current]) go(hits[current]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    } else if (e.key === "Tab") {
      // The search box is the only focus stop: keep Tab from walking into the page underneath.
      e.preventDefault();
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-start justify-center bg-[rgba(10,10,10,.32)] px-10 pt-[12vh]" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Поиск по панели"
        onMouseDown={(e) => e.stopPropagation()}
        className="flex max-h-[70vh] w-[620px] flex-col overflow-hidden rounded-2xl bg-white shadow-pop"
      >
        <label className="flex items-center gap-2.5 border-b border-neutral-100 px-4 py-3.5">
          <Icon name="search" size={18} className="text-neutral-400" />
          <input
            autoFocus
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setActive(0);
            }}
            onKeyDown={onKey}
            placeholder="Раздел, организация, тикет, логин, ФИО или ID платежа"
            className="min-w-0 flex-1 border-0 bg-transparent font-sans text-[15px] outline-none placeholder:text-neutral-400"
          />
          {loading && <span className="text-xs text-neutral-400">Ищем…</span>}
          <span className="rounded-md border border-neutral-200 px-1.5 py-px text-[11px] text-neutral-500">Esc</span>
        </label>
        <div ref={listRef} role="listbox" className="overflow-auto p-1.5">
          {hits.map((h, i) => (
            <div key={h.key}>
              {h.group !== hits[i - 1]?.group && <div className="px-2.5 pt-2 pb-1 text-[10px] font-semibold tracking-[.06em] text-neutral-400 uppercase">{h.group}</div>}
              <button
                type="button"
                role="option"
                aria-selected={i === current}
                onMouseEnter={() => setActive(i)}
                onClick={() => go(h)}
                className={cn("flex w-full items-center gap-2.5 rounded-lg border-0 px-2.5 py-2 text-left text-[13px]", i === current ? "bg-neutral-100" : "bg-transparent")}
              >
                <Icon name={h.icon} size={17} className="shrink-0 text-neutral-400" />
                <span className="min-w-0 flex-1 truncate">{h.title}</span>
                {h.hint && <span className="max-w-[45%] shrink-0 truncate text-xs text-neutral-400">{h.hint}</span>}
              </button>
            </div>
          ))}
          {!hits.length && <div className="px-3 py-8 text-center text-[13px] text-neutral-400">{loading ? "Ищем…" : "Ничего не найдено"}</div>}
        </div>
        <div className="flex gap-4 border-t border-neutral-100 px-4 py-2 text-[11px] text-neutral-400">
          <span>↑↓ — выбор</span>
          <span>Enter — открыть</span>
          <span>Esc — закрыть</span>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/** Header search: a button that opens the palette, also on Ctrl/⌘+K from anywhere in the panel. */
export function CommandPalette() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-9 max-w-[520px] flex-1 items-center gap-2 rounded-full border-0 bg-neutral-100 px-3.5 text-left text-sm text-neutral-400 hover:bg-neutral-200/70"
      >
        <Icon name="search" size={17} />
        <span className="min-w-0 flex-1 truncate">Поиск: раздел, организация, тикет, аккаунт, платёж</span>
        <span className="rounded-md border border-neutral-200 bg-white px-1.5 py-px text-[11px] text-neutral-500">Ctrl K</span>
      </button>
      {/* Mounted per opening: the query and the highlighted row start fresh each time. */}
      {open && <Palette onClose={() => setOpen(false)} />}
    </>
  );
}
