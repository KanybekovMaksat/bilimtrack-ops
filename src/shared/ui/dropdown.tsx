import { useEffect, useEffectEvent, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "../lib";
import { Icon, type IconName } from "./icon";
import { UserAvatar } from "./user-avatar";

export type DropdownOption<V extends string> = {
  value: V;
  label: string;
  /** Second line under the label (login, description). */
  hint?: string;
  icon?: IconName;
  iconColor?: string;
  /** Person option: photo with an initials fallback. */
  avatar?: { src?: string | null; initials: string };
  /** Small coloured dot (priority, column). */
  dot?: string;
};

type Props<V extends string> = {
  value: V | null;
  onChange: (value: V | null) => void;
  options: DropdownOption<V>[];
  /** Shown when nothing is chosen; also the «reset» row when `clearable`. */
  placeholder: string;
  /** Adds a «placeholder» row that resets the value to null (filters). */
  clearable?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  /** "chip" = filter-bar trigger, "field" = form input trigger. */
  look?: "chip" | "field";
  /** Chip caption before the chosen value: «Исполнитель: Асанов». */
  label?: string;
  className?: string;
  menuWidth?: number;
  footer?: ReactNode;
};

function OptionGlyph<V extends string>({ o, size }: { o: DropdownOption<V>; size: number }) {
  if (o.avatar) return <UserAvatar src={o.avatar.src} initials={o.avatar.initials} size={size} className="text-[9px]" />;
  if (o.icon) return <Icon name={o.icon} size={size - 4} style={{ color: o.iconColor }} className={o.iconColor ? undefined : "text-neutral-400"} />;
  if (o.dot) return <span className="size-2 shrink-0 rounded-full" style={{ background: o.dot }} />;
  return null;
}

/** Select with a popup list: optional search, avatars, icons. The list is portalled, so modals do not clip it. */
export function Dropdown<V extends string>({
  value,
  onChange,
  options,
  placeholder,
  clearable,
  searchable,
  searchPlaceholder = "Поиск",
  look = "field",
  label,
  className,
  menuWidth,
  footer,
}: Props<V>) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [pos, setPos] = useState<{ left: number; top: number; width: number; up: boolean } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value) ?? null;

  const q = query.trim().toLowerCase();
  const rows: (DropdownOption<V> | null)[] = [
    ...(clearable && !q ? [null] : []),
    ...options.filter((o) => !q || `${o.label} ${o.hint ?? ""}`.toLowerCase().includes(q)),
  ];

  // Effect event: reads the latest menuWidth without re-subscribing the listeners.
  const place = useEffectEvent(() => {
    const r = triggerRef.current?.getBoundingClientRect();
    if (!r) return;
    const width = Math.max(menuWidth ?? 0, r.width, 220);
    const up = r.bottom + 320 > window.innerHeight && r.top > 320;
    setPos({ left: Math.min(r.left, window.innerWidth - width - 8), top: up ? r.top - 6 : r.bottom + 6, width, up });
  });

  useLayoutEffect(() => {
    if (open) place();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!menuRef.current?.contains(t) && !triggerRef.current?.contains(t)) setOpen(false);
    };
    const reposition = () => place();
    document.addEventListener("mousedown", close);
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);
    return () => {
      document.removeEventListener("mousedown", close);
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
    };
  }, [open]);

  const toggle = () => {
    setQuery("");
    setActive(0);
    setOpen((v) => !v);
  };
  const choose = (o: DropdownOption<V> | null) => {
    onChange(o ? o.value : null);
    setOpen(false);
    triggerRef.current?.focus();
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(rows.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter" && open) {
      e.preventDefault();
      if (rows[active] !== undefined) choose(rows[active]);
    } else if (e.key === "Escape" && open) {
      e.preventDefault();
      setOpen(false);
    }
  };

  const chosen = selected && look === "chip" && clearable;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={toggle}
        onKeyDown={onKey}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          look === "chip"
            ? cn(
                "flex h-[34px] max-w-[260px] items-center gap-1.5 rounded-full border px-3 text-[13px] font-medium whitespace-nowrap",
                chosen ? "border-brand bg-brand-50 text-brand" : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300",
              )
            : cn(
                "flex h-10 w-full items-center gap-2 rounded-full border bg-white px-4 text-left text-sm outline-none",
                open ? "border-neutral-700" : "border-neutral-200",
              ),
          className,
        )}
      >
        {selected && <OptionGlyph o={selected} size={look === "chip" ? 20 : 22} />}
        <span className={cn("min-w-0 flex-1 truncate", !selected && look === "field" && "text-neutral-400")}>
          {selected ? (label && look === "chip" ? `${label}: ${selected.label}` : selected.label) : (label ?? placeholder)}
        </span>
        <Icon name="chevron-down" size={14} className={cn("shrink-0 opacity-60 transition-transform", open && "rotate-180")} />
      </button>
      {open &&
        pos &&
        createPortal(
          <div
            ref={menuRef}
            role="listbox"
            onKeyDown={onKey}
            className="fixed z-[60] flex max-h-[320px] flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-pop"
            style={{ left: pos.left, width: pos.width, ...(pos.up ? { bottom: window.innerHeight - pos.top } : { top: pos.top }) }}
          >
            {searchable && (
              <label className="flex items-center gap-2 border-b border-neutral-100 px-3 py-2">
                <Icon name="search" size={15} className="text-neutral-400" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setActive(0);
                  }}
                  onKeyDown={onKey}
                  placeholder={searchPlaceholder}
                  className="min-w-0 flex-1 border-0 bg-transparent font-sans text-[13px] outline-none placeholder:text-neutral-400"
                />
              </label>
            )}
            <div className="overflow-auto p-1">
              {rows.map((o, i) => {
                const on = o ? o.value === value : value === null;
                return (
                  <button
                    key={o?.value ?? "__all"}
                    type="button"
                    role="option"
                    aria-selected={on}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => choose(o)}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-lg border-0 px-2.5 py-2 text-left text-[13px]",
                      i === active ? "bg-neutral-100" : "bg-transparent",
                    )}
                  >
                    {o ? <OptionGlyph o={o} size={24} /> : <Icon name="x" size={16} className="text-neutral-400" />}
                    <span className="min-w-0 flex-1">
                      <span className={cn("block truncate", !o && "text-neutral-500")}>{o ? o.label : placeholder}</span>
                      {o?.hint && <span className="block truncate font-num text-[11px] text-neutral-400">{o.hint}</span>}
                    </span>
                    {on && <Icon name="check" size={15} className="text-brand" />}
                  </button>
                );
              })}
              {!rows.length && <div className="px-3 py-4 text-center text-xs text-neutral-400">Ничего не найдено</div>}
            </div>
            {footer}
          </div>,
          document.body,
        )}
    </>
  );
}
