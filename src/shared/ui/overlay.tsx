import { useEffect, useRef, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";
import { cn } from "../lib";

function useEscape(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      // A dropdown inside the dialog handles its own Escape (and marks it handled).
      if (e.key === "Escape" && !e.defaultPrevented) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
}

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Keeps keyboard focus inside an open dialog: moves it in on open, cycles Tab / Shift+Tab at the edges
 * and returns it to the element that opened the dialog on close.
 * Focus in a portalled popup of the dialog (a dropdown list) is left alone.
 */
function useFocusTrap(ref: RefObject<HTMLDivElement | null>, open: boolean) {
  useEffect(() => {
    const box = ref.current;
    if (!open || !box) return;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const stops = () => [...box.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.offsetParent !== null);
    // An `autoFocus` field inside already has the focus: do not steal it.
    if (!box.contains(document.activeElement)) (stops()[0] ?? box).focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab" || !box.contains(document.activeElement)) return;
      const list = stops();
      const first = list[0];
      const last = list[list.length - 1];
      if (!first) e.preventDefault();
      else if (e.shiftKey && (document.activeElement === first || document.activeElement === box)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      if (opener?.isConnected) opener.focus();
    };
  }, [ref, open]);
}

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  width?: number;
  className?: string;
  children: ReactNode;
};

/** Centered confirmation dialog: 20px radius card on a dimmed backdrop. */
export function Modal({ open, onClose, title, width = 520, className, children }: ModalProps) {
  const boxRef = useRef<HTMLDivElement>(null);
  useEscape(open, onClose);
  useFocusTrap(boxRef, open);
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(10,10,10,.32)] p-10" onMouseDown={onClose}>
      <div
        ref={boxRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        onMouseDown={(e) => e.stopPropagation()}
        className={cn("flex max-h-full flex-col gap-3.5 overflow-auto rounded-[20px] bg-white p-6 outline-none", className)}
        style={{ width }}
      >
        {title && <div className="text-[17px] font-semibold">{title}</div>}
        {children}
      </div>
    </div>,
    document.body,
  );
}

export function ModalActions({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("flex justify-end gap-2", className)}>{children}</div>;
}

type DrawerProps = { open: boolean; onClose: () => void; header: ReactNode; footer?: ReactNode; children: ReactNode };

/** Right-hand panel that keeps the list underneath in place. */
export function Drawer({ open, onClose, header, footer, children }: DrawerProps) {
  const boxRef = useRef<HTMLDivElement>(null);
  useEscape(open, onClose);
  useFocusTrap(boxRef, open);
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-40 flex justify-end bg-[rgba(10,10,10,.24)]" onMouseDown={onClose}>
      <div
        ref={boxRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        onMouseDown={(e) => e.stopPropagation()}
        className="flex h-full w-[460px] flex-col overflow-auto border-l border-neutral-200 bg-white outline-none"
      >
        <div className="sticky top-0 z-10 flex items-center gap-1.5 border-b border-neutral-100 bg-white px-4 py-3">{header}</div>
        {children}
        {footer && (
          <div className="sticky bottom-0 mt-auto flex gap-2 border-t border-neutral-100 bg-white px-[18px] py-3.5">{footer}</div>
        )}
      </div>
    </div>,
    document.body,
  );
}
