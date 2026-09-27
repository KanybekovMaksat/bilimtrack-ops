import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../lib";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-2xl border border-neutral-200", className)} {...props} />;
}

type CardHeaderProps = { title: ReactNode; subtitle?: ReactNode; action?: ReactNode; className?: string };

export function CardHeader({ title, subtitle, action, className }: CardHeaderProps) {
  return (
    <div className={cn("flex items-center gap-2.5 border-b border-neutral-100 px-4 py-[13px]", className)}>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium">{title}</div>
        {subtitle && <div className="text-xs text-neutral-500">{subtitle}</div>}
      </div>
      {action}
    </div>
  );
}

/** Small grey caption above a block ("Очередь работы", "Действия"). */
export function SectionLabel({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("text-xs font-semibold text-neutral-500", className)}>{children}</div>;
}
