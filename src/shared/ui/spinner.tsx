import { LoaderCircle } from "lucide-react";

export function Spinner({ label = "Загрузка…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-12 text-sm text-fg-muted">
      <LoaderCircle className="size-4 animate-spin" />
      {label}
    </div>
  );
}
