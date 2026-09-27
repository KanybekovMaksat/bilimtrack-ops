import { useState, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "../lib";
import { Icon } from "./icon";

type FieldProps = { label: ReactNode; strong?: boolean; className?: string; children: ReactNode };

/** Label above a control. `strong` = the 12/600 label style used in newer modals. */
export function Field({ label, strong, className, children }: FieldProps) {
  return (
    <label className={cn("flex flex-col gap-1.5", className)}>
      <span className={cn("text-xs text-neutral-500", strong && "font-semibold")}>{label}</span>
      {children}
    </label>
  );
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  /** "filled" = grey pill (default), "plain" = white with a focus border. */
  look?: "filled" | "plain";
  inputSize?: "sm" | "md" | "lg";
  numeric?: boolean;
};

const inputSizes = { sm: "h-9 px-3.5 text-[13px]", md: "h-[38px] px-4 text-sm", lg: "h-10 px-4 text-sm" };

export function TextInput({ look = "filled", inputSize = "lg", numeric, className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        "w-full rounded-full border border-neutral-200 font-sans outline-none focus:border-neutral-700",
        look === "filled" ? "bg-neutral-100" : "bg-white",
        inputSizes[inputSize],
        numeric && "font-num",
        className,
      )}
      {...props}
    />
  );
}

type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & { look?: "filled" | "plain" };

export function TextArea({ look = "filled", className, ...props }: TextAreaProps) {
  return (
    <textarea
      className={cn(
        "min-h-[70px] w-full border border-neutral-200 font-sans outline-none focus:border-neutral-700",
        look === "filled"
          ? "resize-none rounded-[14px] bg-neutral-100 px-3.5 py-2.5 text-[13px]"
          : "resize-y rounded-2xl bg-white px-4 py-2.5 text-sm leading-5",
        className,
      )}
      {...props}
    />
  );
}

/** Read-only select-looking box (the prototype shows static values there). */
export function StaticSelect({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "flex h-10 items-center justify-between gap-2 rounded-full border border-neutral-200 px-4 text-sm",
        className,
      )}
    >
      {children}
      <Icon name="chevron-down" className="text-neutral-400" />
    </div>
  );
}

type KVProps = { k: ReactNode; width?: number; className?: string; children: ReactNode };

/** Key / value line: small grey key column, value on the right. */
export function KV({ k, width = 130, className, children }: KVProps) {
  return (
    <div className={cn("flex gap-3", className)}>
      <span className="shrink-0 text-xs text-neutral-400" style={{ width }}>
        {k}
      </span>
      <span className="min-w-0 flex-1 text-[13px]">{children}</span>
    </div>
  );
}

/** Grey two-column summary grid used inside confirmation modals. */
export function SummaryGrid({ rows, keyWidth = 120 }: { rows: [ReactNode, ReactNode][]; keyWidth?: number }) {
  return (
    <div
      className="grid gap-x-3 gap-y-2 rounded-xl bg-neutral-50 px-3.5 py-3 text-[13px]"
      style={{ gridTemplateColumns: `${keyWidth}px 1fr` }}
    >
      {rows.map(([k, v], i) => (
        <div key={i} className="contents">
          <span className="text-neutral-500">{k}</span>
          <span>{v}</span>
        </div>
      ))}
    </div>
  );
}

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & { options: { value: string; label: string }[]; placeholder?: string };

/** Native select dressed as the design's pill input. */
export function SelectInput({ options, placeholder, className, ...props }: SelectProps) {
  return (
    <span className={cn("relative block", className)}>
      <select
        className="h-10 w-full appearance-none rounded-full border border-neutral-200 bg-white pr-9 pl-4 font-sans text-sm outline-none focus:border-neutral-700"
        {...props}
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <Icon name="chevron-down" size={16} className="pointer-events-none absolute top-3 right-3.5 text-neutral-400" />
    </span>
  );
}

/** One-time secret (temporary password): monospace value with a copy button. */
export function SecretValue({ label, value }: { label: ReactNode; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-3.5 py-2.5">
      <span className="w-[120px] shrink-0 text-xs text-neutral-500">{label}</span>
      <span className="min-w-0 flex-1 truncate font-mono text-sm select-all">{value}</span>
      <button
        type="button"
        onClick={() => {
          // Clipboard may be blocked (no permission / insecure origin): the value stays selectable by hand.
          navigator.clipboard?.writeText(value).then(
            () => setCopied(true),
            () => setCopied(false),
          );
        }}
        className="flex items-center gap-1 rounded-full border-0 bg-transparent px-2 py-1 text-xs text-brand hover:bg-brand-50"
      >
        <Icon name={copied ? "check" : "copy"} size={14} />
        {copied ? "Скопировано" : "Копировать"}
      </button>
    </div>
  );
}
