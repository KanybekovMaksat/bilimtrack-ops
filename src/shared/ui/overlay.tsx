import { useEffect, type ReactNode } from "react";
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
  useEscape(open, onClose);
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(10,10,10,.32)] p-10" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        onMouseDown={(e) => e.stopPropagation()}
        className={cn("flex max-h-full flex-col gap-3.5 overflow-auto rounded-[20px] bg-white p-6", className)}
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
  useEscape(open, onClose);
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-40 flex justify-end bg-[rgba(10,10,10,.24)]" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        onMouseDown={(e) => e.stopPropagation()}
        className="flex h-full w-[460px] flex-col overflow-auto border-l border-neutral-200 bg-white"
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
