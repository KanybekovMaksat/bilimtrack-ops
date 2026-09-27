import { createBrowserRouter } from "react-router";
import { AccountPage } from "@/pages/account";
import { AccountsPage } from "@/pages/accounts";
import { AuditPage } from "@/pages/audit";
import { ChannelsPage } from "@/pages/channels";
import { DeniedPage, NotFoundPage } from "@/pages/denied";
import { DictsPage } from "@/pages/dicts";
import { ErrorsPage } from "@/pages/errors";
import { HomePage } from "@/pages/home";
import { IdeasPage } from "@/pages/ideas";
import { InboxPage } from "@/pages/inbox";
import { LeadsPage } from "@/pages/leads";
import { LicensesPage } from "@/pages/licenses";
import { LoginPage } from "@/pages/login";
import { LoginsPage } from "@/pages/logins";
import { MediaPage } from "@/pages/media";
import { MetricsPage } from "@/pages/metrics";
import { OnboardingPage } from "@/pages/onboarding";
import { OrgBillingPage } from "@/pages/org-billing";
import { OrgDetailsPage } from "@/pages/org-details";
import { OrgNewPage } from "@/pages/org-new";
import { OrgsPage } from "@/pages/orgs";
import { PaymentsPage } from "@/pages/payments";
import { PlanPage } from "@/pages/plan";
import { PlansPage } from "@/pages/plans";
import { PostEditorPage } from "@/pages/post-editor";
import { PostsPage } from "@/pages/posts";
import { ProvidersPage } from "@/pages/providers";
import { SubscriptionsPage } from "@/pages/subscriptions";
import { SystemPage } from "@/pages/system";
import { TasksPage } from "@/pages/tasks";
import { TeamPage } from "@/pages/team";
import { TemplatesPage } from "@/pages/templates";
import { TicketDetailsPage } from "@/pages/ticket-details";
import { TicketPriorityPage } from "@/pages/ticket-priority";
import { TicketStatesPage } from "@/pages/ticket-states";
import { TicketsPage } from "@/pages/tickets";
import { routes } from "@/shared/config";
import { AppShell } from "@/widgets/app-shell";
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
        <AppShell />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <HomePage /> },

      { path: routes.metrics, element: <MetricsPage /> },

      { path: routes.leads, element: <LeadsPage /> },

      { path: routes.tickets, element: <TicketsPage /> },
      { path: routes.ticket(":id"), element: <TicketDetailsPage /> },
      { path: routes.ticketStates, element: <TicketStatesPage /> },
      { path: routes.ticketPriority, element: <TicketPriorityPage /> },
      { path: routes.ideas, element: <IdeasPage /> },

      { path: routes.orgs, element: <OrgsPage /> },
      { path: routes.orgNew, element: <OrgNewPage /> },
      { path: routes.org(":slug"), element: <OrgDetailsPage /> },
      { path: routes.onboarding, element: <OnboardingPage /> },
      { path: routes.licenses, element: <LicensesPage /> },
      { path: routes.accounts, element: <AccountsPage /> },
      { path: routes.account(":login"), element: <AccountPage /> },

      { path: routes.plans, element: <PlansPage /> },
      { path: routes.plan(":code"), element: <PlanPage /> },
      { path: routes.subscriptions, element: <SubscriptionsPage /> },
      { path: routes.payments, element: <PaymentsPage /> },
      { path: routes.providers, element: <ProvidersPage /> },
      { path: routes.orgBilling, element: <OrgBillingPage /> },

      { path: routes.channels, element: <ChannelsPage /> },
      { path: routes.inbox, element: <InboxPage /> },
      { path: routes.templates, element: <TemplatesPage /> },

      { path: routes.tasks, element: <TasksPage /> },

      { path: routes.posts, element: <PostsPage /> },
      { path: routes.postEditor, element: <PostEditorPage /> },
      { path: routes.dicts, element: <DictsPage /> },
      { path: routes.media, element: <MediaPage /> },

      { path: routes.audit, element: <AuditPage /> },
      { path: routes.logins, element: <LoginsPage /> },
      { path: routes.system, element: <SystemPage /> },
      { path: routes.errors, element: <ErrorsPage /> },
      { path: routes.team, element: <TeamPage /> },
      { path: routes.denied, element: <DeniedPage /> },

      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
