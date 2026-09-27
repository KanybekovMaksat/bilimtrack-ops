import { useEffect, type ReactNode } from "react";
import { Navigate } from "react-router";
import { useSession } from "@/entities/session";
import { ChangePasswordForm } from "@/features/change-password";
import { routes } from "@/shared/config";

/** Signed-in platform operator; a temporary password must be changed before the panel opens. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const user = useSession((s) => s.user);
  const revalidate = useSession((s) => s.revalidate);

  // A persisted session may outlive the operator's access: re-check ops/me once per load.
  useEffect(() => {
    void revalidate();
  }, [revalidate]);

  if (!user) return <Navigate to={routes.login} replace />;
  if (user.mustChangePassword) return <ChangePasswordForm />;
  return children;
}

export function GuestOnly({ children }: { children: ReactNode }) {
  const user = useSession((s) => s.user);
  return user ? <Navigate to={routes.home} replace /> : children;
}
