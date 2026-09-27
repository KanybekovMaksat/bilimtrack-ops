import { createBrowserRouter } from "react-router";
import { DashboardPage } from "@/pages/dashboard";
import { LoginPage } from "@/pages/login";
import { NotFoundPage } from "@/pages/not-found";
import { OrganizationsPage } from "@/pages/organizations";
import { ServicesPage } from "@/pages/services";
import { TicketDetailsPage } from "@/pages/ticket-details";
import { TicketsPage } from "@/pages/tickets";
import { routes } from "@/shared/config";
import { AppLayout } from "@/widgets/app-layout";
import { GuestOnly, RequireAuth } from "./guards";

export const router = createBrowserRouter([
  {
    path: routes.login,
    element: (
      <GuestOnly>
        <LoginPage />
      </GuestOnly>
    ),
  },
  {
    element: (
      <RequireAuth>
        <AppLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: routes.tickets, element: <TicketsPage /> },
      { path: routes.ticket(":id"), element: <TicketDetailsPage /> },
      { path: routes.organizations, element: <OrganizationsPage /> },
      { path: routes.services, element: <ServicesPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
