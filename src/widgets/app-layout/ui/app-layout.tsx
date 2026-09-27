import { useState } from "react";
import { NavLink, Outlet } from "react-router";
import { Activity, Building2, LayoutDashboard, Menu, Ticket } from "lucide-react";
import { useSessionUser } from "@/entities/session";
import { LogoutButton } from "@/features/auth";
import { ThemeToggle } from "@/features/toggle-theme";
import { routes } from "@/shared/config";
import { cn } from "@/shared/lib";
import { Avatar, Button } from "@/shared/ui";

const nav = [
  { to: routes.dashboard, label: "Обзор", icon: LayoutDashboard, end: true },
  { to: routes.tickets, label: "Тикеты", icon: Ticket },
  { to: routes.organizations, label: "Организации", icon: Building2 },
  { to: routes.services, label: "Сервисы", icon: Activity },
];

export function AppLayout() {
  const user = useSessionUser();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex min-h-dvh">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-line bg-surface transition-transform lg:static lg:translate-x-0",
          menuOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center gap-2.5 px-5">
          <span className="flex size-8 items-center justify-center rounded-lg bg-brand text-sm font-bold text-white">B</span>
          <span className="font-semibold">Bilimtrack <span className="text-brand">Ops</span></span>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {nav.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive ? "bg-brand/10 text-brand" : "text-fg-muted hover:bg-muted hover:text-fg",
                )
              }
            >
              <Icon className="size-4" />
              {label}
            </NavLink>
          ))}
        </nav>
        {user && (
          <div className="flex items-center gap-3 border-t border-line p-4">
            <Avatar name={user.name} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{user.name}</p>
              <p className="truncate text-xs text-fg-muted">{user.email}</p>
            </div>
            <LogoutButton />
          </div>
        )}
      </aside>

      {menuOpen && <div className="fixed inset-0 z-30 bg-black/30 lg:hidden" onClick={() => setMenuOpen(false)} />}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-line bg-surface/80 px-4 backdrop-blur sm:px-6">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMenuOpen(true)} aria-label="Меню">
            <Menu className="size-5" />
          </Button>
          <div className="ml-auto flex items-center gap-1">
            <ThemeToggle />
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
