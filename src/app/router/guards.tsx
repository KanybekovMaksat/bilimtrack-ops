import { useEffect, type ReactNode } from "react";
import { Navigate, Outlet, useLocation } from "react-router";
import { useCan, useSession, type OpsPermission } from "@/entities/session";
import { ChangePasswordForm } from "@/features/change-password";
import { DeniedPage } from "@/pages/denied";
import { afterLogin, loginFor } from "@/shared/config";

/** Signed-in platform operator; a temporary password must be changed before the panel opens. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const user = useSession((s) => s.user);
  const revalidate = useSession((s) => s.revalidate);
  const location = useLocation();

  // A persisted session may outlive the operator's access: re-check ops/me once per load.
  useEffect(() => {
    void revalidate();
  }, [revalidate]);

  // Keep the requested page with its filters: a shared link opens as sent once the operator signs in.
  if (!user) return <Navigate to={loginFor(location.pathname + location.search + location.hash)} replace />;
  if (user.mustChangePassword) return <ChangePasswordForm />;
  return children;
}

export function GuestOnly({ children }: { children: ReactNode }) {
  const user = useSession((s) => s.user);
  const { search } = useLocation();
  return user ? <Navigate to={afterLogin(search)} replace /> : children;
}

/** Sections behind an Ops privilege (a layout route: its child routes render in the outlet).
    Without the privilege the «Доступ закрыт» screen is shown instead. */
export function RequirePermission({ perm }: { perm: OpsPermission }) {
  const can = useCan();
  return can(perm) ? <Outlet /> : <DeniedPage description="У вас нет привилегии на этот раздел. Если доступ нужен для работы, попросите администратора выдать её в разделе «Команда»." />;
}
