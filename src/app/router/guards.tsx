import type { ReactNode } from "react";
import { Navigate } from "react-router";
import { useSession, type StaffRole } from "@/entities/session";
import { DeniedPage } from "@/pages/denied";
import { routes } from "@/shared/config";

export function RequireAuth({ children }: { children: ReactNode }) {
  const user = useSession((s) => s.user);
  return user ? children : <Navigate to={routes.login} replace />;
}

export function GuestOnly({ children }: { children: ReactNode }) {
  const user = useSession((s) => s.user);
  return user ? <Navigate to={routes.home} replace /> : children;
}

/** Hides admin-only sections from the "content" role. */
export function RequireRole({ roles, section, children }: { roles: StaffRole[]; section: string; children: ReactNode }) {
  const role = useSession((s) => s.role);
  if (roles.includes(role)) return children;
  return (
    <DeniedPage
      section={section}
      description={`Раздел «${section}» недоступен роли «Контент». Если доступ нужен для работы, попросите админа платформы изменить роль в разделе «Команда и доступы».`}
    />
  );
}
