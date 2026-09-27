import type { ReactNode } from "react";
import { Navigate } from "react-router";
import { useSession } from "@/entities/session";
import { routes } from "@/shared/config";

export function RequireAuth({ children }: { children: ReactNode }) {
  const user = useSession((s) => s.user);
  return user ? children : <Navigate to={routes.login} replace />;
}

export function GuestOnly({ children }: { children: ReactNode }) {
  const user = useSession((s) => s.user);
  return user ? <Navigate to={routes.home} replace /> : children;
}
