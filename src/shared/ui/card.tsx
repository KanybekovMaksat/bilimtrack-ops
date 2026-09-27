import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../lib";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-xl border border-line bg-surface", className)} {...props} />;
}

export function CardHeader({ title, action }: { title: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
      <h2 className="font-semibold">{title}</h2>
      {action}
    </div>
  );
}
