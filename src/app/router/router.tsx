import { lazy, Suspense } from "react";
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
import { ModerationPage } from "@/pages/moderation";
import { PlansPage } from "@/pages/plans";
import { PostsPage } from "@/pages/posts";
import { ProfilePage } from "@/pages/profile";
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
import { PageSkeleton } from "@/shared/ui";
import { AppShell } from "@/widgets/app-shell";
import { GuestOnly, RequireAuth, RequirePermission } from "./guards";

// BlockNote is heavy: the article editor is loaded only when opened.
const PostEditorPage = lazy(() => import("@/pages/post-editor").then((m) => ({ default: m.PostEditorPage })));
const editor = (
  <RequirePermission perm="content">
    <Suspense fallback={<PageSkeleton />}>
      <PostEditorPage />
    </Suspense>
  </RequirePermission>
);
const need = (perm: string, element: React.ReactNode) => <RequirePermission perm={perm}>{element}</RequirePermission>;


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

      { path: routes.leads, element: need("sales", <LeadsPage />) },

      { path: routes.tickets, element: <TicketsPage /> },
      { path: routes.ticket(":id"), element: <TicketDetailsPage /> },
      { path: routes.ticketStates, element: <TicketStatesPage /> },
      { path: routes.ticketPriority, element: <TicketPriorityPage /> },
      { path: routes.ideas, element: need("support", <IdeasPage />) },
      { path: routes.moderation, element: need("moderation", <ModerationPage />) },

      { path: routes.orgs, element: <OrgsPage /> },
      { path: routes.orgNew, element: need("organizations", <OrgNewPage />) },
      { path: routes.org(":id"), element: <OrgDetailsPage /> },
      { path: routes.onboarding, element: <OnboardingPage /> },
      { path: routes.licenses, element: need("licenses", <LicensesPage />) },
      { path: routes.accounts, element: need("accounts", <AccountsPage />) },
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

      { path: routes.tasks, element: need("tasks", <TasksPage />) },

      { path: routes.posts, element: need("content", <PostsPage />) },
      { path: routes.postEditor, element: editor },
      { path: routes.postEdit(":id"), element: editor },
      { path: routes.dicts, element: need("content", <DictsPage />) },
      { path: routes.media, element: need("content", <MediaPage />) },

      { path: routes.audit, element: need("audit", <AuditPage />) },
      { path: routes.logins, element: need("audit", <LoginsPage />) },
      { path: routes.system, element: <SystemPage /> },
      { path: routes.errors, element: <ErrorsPage /> },
      { path: routes.team, element: <TeamPage /> },
      { path: routes.profile, element: <ProfilePage /> },
      { path: routes.denied, element: <DeniedPage /> },

      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
