import { Link } from "react-router";
import { routes } from "@/shared/config";

export function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
      <p className="text-5xl font-semibold text-brand">404</p>
      <p className="text-fg-muted">Такой страницы нет</p>
      <Link to={routes.dashboard} className="text-sm text-brand hover:underline">На главную</Link>
    </div>
  );
}
