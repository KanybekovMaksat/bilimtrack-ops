import type { ReactNode } from "react";
import { Navigate } from "react-router";
import { useSessionUser } from "@/entities/session";
import { routes } from "@/shared/config";

export function RequireAuth({ children }: { children: ReactNode }) {
  const user = useSessionUser();
  return user ? children : <Navigate to={routes.login} replace />;
}

export function GuestOnly({ children }: { children: ReactNode }) {
  const user = useSessionUser();
  return user ? <Navigate to={routes.dashboard} replace /> : children;
}
