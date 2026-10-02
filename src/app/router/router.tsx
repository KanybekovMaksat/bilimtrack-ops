import { lazy, type ComponentType } from "react";
import { createBrowserRouter } from "react-router";
import { DeniedPage, NotFoundPage } from "@/pages/denied";
import { LoginPage } from "@/pages/login";
import { routes } from "@/shared/config";
import { AppShell } from "@/widgets/app-shell";
import { GuestOnly, RequireAuth, RequirePermission } from "./guards";

/** Every screen is its own chunk; AppShell's Suspense shows the skeleton while one loads. */
const page = <M,>(load: () => Promise<M>, pick: (m: M) => ComponentType) => {
  const Page = lazy(() => load().then((m) => ({ default: pick(m) })));
  return <Page />;
};

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
      { index: true, element: page(() => import("@/pages/home"), (m) => m.HomePage) },
      { path: routes.metrics, element: page(() => import("@/pages/metrics"), (m) => m.MetricsPage) },
      {
        element: <RequirePermission perm="analytics" />,
        children: [{ path: routes.analytics, element: page(() => import("@/pages/analytics"), (m) => m.AnalyticsPage) }],
      },

      {
        element: <RequirePermission perm="sales" />,
        children: [{ path: routes.leads, element: page(() => import("@/pages/leads"), (m) => m.LeadsPage) }],
      },
      {
        element: <RequirePermission perm="support" />,
        children: [
          { path: routes.tickets, element: page(() => import("@/pages/tickets"), (m) => m.TicketsPage) },
          { path: routes.ticket(":id"), element: page(() => import("@/pages/ticket-details"), (m) => m.TicketDetailsPage) },
          { path: routes.ideas, element: page(() => import("@/pages/ideas"), (m) => m.IdeasPage) },
        ],
      },
      {
        element: <RequirePermission perm="moderation" />,
        children: [{ path: routes.moderation, element: page(() => import("@/pages/moderation"), (m) => m.ModerationPage) }],
      },

      { path: routes.orgs, element: page(() => import("@/pages/orgs"), (m) => m.OrgsPage) },
      { path: routes.org(":id"), element: page(() => import("@/pages/org-details"), (m) => m.OrgDetailsPage) },
      {
        element: <RequirePermission perm="organizations" />,
        children: [{ path: routes.orgNew, element: page(() => import("@/pages/org-new"), (m) => m.OrgNewPage) }],
      },
      { path: routes.onboarding, element: page(() => import("@/pages/onboarding"), (m) => m.OnboardingPage) },
      {
        element: <RequirePermission perm="licenses" />,
        children: [{ path: routes.licenses, element: page(() => import("@/pages/licenses"), (m) => m.LicensesPage) }],
      },
      {
        element: <RequirePermission perm="accounts" />,
        children: [
          { path: routes.accounts, element: page(() => import("@/pages/accounts"), (m) => m.AccountsPage) },
          { path: routes.account(":login"), element: page(() => import("@/pages/account"), (m) => m.AccountPage) },
        ],
      },

      { path: routes.plans, element: page(() => import("@/pages/plans"), (m) => m.PlansPage) },
      { path: routes.plan(":code"), element: page(() => import("@/pages/plan"), (m) => m.PlanPage) },
      { path: routes.subscriptions, element: page(() => import("@/pages/subscriptions"), (m) => m.SubscriptionsPage) },
      { path: routes.payments, element: page(() => import("@/pages/payments"), (m) => m.PaymentsPage) },
      { path: routes.providers, element: page(() => import("@/pages/providers"), (m) => m.ProvidersPage) },
      { path: routes.orgBilling, element: page(() => import("@/pages/org-billing"), (m) => m.OrgBillingPage) },

      { path: routes.channels, element: page(() => import("@/pages/channels"), (m) => m.ChannelsPage) },
      { path: routes.inbox, element: page(() => import("@/pages/inbox"), (m) => m.InboxPage) },
      { path: routes.templates, element: page(() => import("@/pages/templates"), (m) => m.TemplatesPage) },

      {
        element: <RequirePermission perm="tasks" />,
        children: [{ path: routes.tasks, element: page(() => import("@/pages/tasks"), (m) => m.TasksPage) }],
      },
      {
        element: <RequirePermission perm="content" />,
        children: [
          { path: routes.forum, element: page(() => import("@/pages/forum"), (m) => m.ForumPage) },
          { path: routes.posts, element: page(() => import("@/pages/posts"), (m) => m.PostsPage) },
          // BlockNote is heavy: its chunk loads only when the editor opens.
          { path: routes.postEditor, element: page(() => import("@/pages/post-editor"), (m) => m.PostEditorPage) },
          { path: routes.postEdit(":id"), element: page(() => import("@/pages/post-editor"), (m) => m.PostEditorPage) },
          { path: routes.dicts, element: page(() => import("@/pages/dicts"), (m) => m.DictsPage) },
          { path: routes.media, element: page(() => import("@/pages/media"), (m) => m.MediaPage) },
        ],
      },
      {
        element: <RequirePermission perm="audit" />,
        children: [
          { path: routes.audit, element: page(() => import("@/pages/audit"), (m) => m.AuditPage) },
          { path: routes.logins, element: page(() => import("@/pages/logins"), (m) => m.LoginsPage) },
        ],
      },

      { path: routes.system, element: page(() => import("@/pages/system"), (m) => m.SystemPage) },
      { path: routes.errors, element: page(() => import("@/pages/errors"), (m) => m.ErrorsPage) },
      // Everyone sees the team; changing it needs `team` (checked on the page).
      { path: routes.team, element: page(() => import("@/pages/team"), (m) => m.TeamPage) },
      { path: routes.profile, element: page(() => import("@/pages/profile"), (m) => m.ProfilePage) },
      { path: routes.denied, element: <DeniedPage /> },

      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
