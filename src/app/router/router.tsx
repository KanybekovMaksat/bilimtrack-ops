import type { ReactElement } from "react";
import { createBrowserRouter, type RouteObject } from "react-router";
import { AccountPage } from "@/pages/account";
import { AccountSessionPage } from "@/pages/account-session";
import { AccountsPage } from "@/pages/accounts";
import { AnnouncementsPage } from "@/pages/announcements";
import { AuditPage } from "@/pages/audit";
import { ChannelsPage } from "@/pages/channels";
import { DeniedPage, NotFoundPage } from "@/pages/denied";
import { DictsPage } from "@/pages/dicts";
import { ErrorsPage } from "@/pages/errors";
import { FunnelPage } from "@/pages/funnel";
import { HealthPage } from "@/pages/health";
import { HomePage } from "@/pages/home";
import { IdeasPage } from "@/pages/ideas";
import { InboxPage } from "@/pages/inbox";
import { LeadsPage } from "@/pages/leads";
import { LicensesPage } from "@/pages/licenses";
import { ListsPage } from "@/pages/lists";
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
import { GuestOnly, RequireAuth, RequireRole } from "./guards";

/** Admin-only route; `section` names it on the access-denied screen. */
const admin = (path: string, section: string, element: ReactElement): RouteObject => ({
  path,
  element: (
    <RequireRole roles={["admin"]} section={section}>
      {element}
    </RequireRole>
  ),
});

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

      admin(routes.metrics, "Сводные метрики", <MetricsPage />),
      admin(routes.health, "Здоровье клиентов", <HealthPage />),

      admin(routes.leads, "Заявки на демо", <LeadsPage />),
      admin(routes.funnel, "Воронка", <FunnelPage />),

      admin(routes.tickets, "Тикеты", <TicketsPage />),
      admin(routes.ticket(":id"), "Тикеты", <TicketDetailsPage />),
      admin(routes.ticketStates, "Тикеты", <TicketStatesPage />),
      admin(routes.ticketPriority, "Тикеты", <TicketPriorityPage />),
      admin(routes.ideas, "Идеи", <IdeasPage />),

      admin(routes.orgs, "Организации", <OrgsPage />),
      admin(routes.orgNew, "Организации", <OrgNewPage />),
      admin(routes.org(":slug"), "Организации", <OrgDetailsPage />),
      admin(routes.onboarding, "Онбординг", <OnboardingPage />),
      admin(routes.licenses, "Лицензии и модули", <LicensesPage />),
      admin(routes.accounts, "Аккаунты", <AccountsPage />),
      admin(routes.account(":login"), "Аккаунты", <AccountPage />),
      admin(routes.accountSession(":login"), "Аккаунты", <AccountSessionPage />),
      admin(routes.lists, "Списки и рассылки", <ListsPage />),
      admin(routes.announcements, "Анонсы", <AnnouncementsPage />),

      admin(routes.plans, "Тарифы", <PlansPage />),
      admin(routes.plan(":code"), "Тарифы", <PlanPage />),
      admin(routes.subscriptions, "Подписки", <SubscriptionsPage />),
      admin(routes.payments, "Платежи", <PaymentsPage />),
      admin(routes.providers, "Провайдеры", <ProvidersPage />),
      admin(routes.orgBilling, "Биллинг организаций", <OrgBillingPage />),

      admin(routes.channels, "Каналы", <ChannelsPage />),
      admin(routes.inbox, "Входящие", <InboxPage />),
      admin(routes.templates, "Шаблоны", <TemplatesPage />),

      admin(routes.tasks, "Доска задач", <TasksPage />),

      { path: routes.posts, element: <PostsPage /> },
      { path: routes.postEditor, element: <PostEditorPage /> },
      { path: routes.dicts, element: <DictsPage /> },
      { path: routes.media, element: <MediaPage /> },

      admin(routes.audit, "Аудит", <AuditPage />),
      admin(routes.logins, "Логи входов", <LoginsPage />),
      admin(routes.system, "Статус системы", <SystemPage />),
      admin(routes.errors, "Ошибки", <ErrorsPage />),
      admin(routes.team, "Команда", <TeamPage />),
      { path: routes.denied, element: <DeniedPage /> },

      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
