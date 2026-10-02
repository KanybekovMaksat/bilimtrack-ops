/**
 * Root segment of every query key, one per backend resource. Entities build their key factories
 * on top of these and invalidate another entity's cache by its root: FSD forbids entities to import
 * each other's factories, and a shared name keeps that from turning into a stray string.
 */
export const QK = {
  orgs: "orgs",
  platformSummary: "ops-summary",
  licenses: "licenses",
  accounts: "accounts",
  accountSearch: "account-search",
  tickets: "tickets",
  ticketTemplates: "ticket-templates",
  ideas: "ideas",
  leads: "leads",
  cms: "cms",
  moderation: "moderation",
  team: "ops-team",
  permissions: "ops-permissions",
  operators: "ops-operators",
  boards: "ops-boards",
  tasks: "ops-tasks",
  taskComments: "ops-task-comments",
  audit: "ops-audit",
  auditChoices: "ops-audit-choices",
  accessLogs: "ops-access-logs",
  systemStatus: "system-status",
  billingSummary: "billing-summary",
  billingPlans: "billing-plans",
  billingSubscriptions: "billing-subscriptions",
  billingPayments: "billing-payments",
  billingWebhooks: "billing-webhooks",
  orgPaywall: "org-paywall",
  analytics: "ops-analytics",
  forumPublications: "ops-forum-publications",
  forumAccount: "ops-forum-account",
} as const;
