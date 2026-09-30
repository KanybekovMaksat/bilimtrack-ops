/** Public blog, for «На сайте» links from the article editor. */
export const BLOG_URL = (import.meta.env.VITE_BLOG_URL || "https://bilimtrack.kg/blog").replace(/\/$/, "");

export const routes = {
  login: "/login",
  home: "/",
  metrics: "/metrics",
  analytics: "/analytics",
  leads: "/leads",
  tickets: "/tickets",
  ticket: (id: string | number) => `/tickets/${id}`,
  ideas: "/ideas",
  orgs: "/orgs",
  org: (id: string | number) => `/orgs/${id}`,
  orgNew: "/orgs-new",
  onboarding: "/onboarding",
  licenses: "/licenses",
  accounts: "/accounts",
  account: (login: string) => `/accounts/${login}`,
  plans: "/plans",
  plan: (code: string) => `/plans/${code}`,
  subscriptions: "/subscriptions",
  payments: "/payments",
  providers: "/providers",
  orgBilling: "/org-billing",
  channels: "/channels",
  inbox: "/inbox",
  templates: "/templates",
  tasks: "/tasks",
  posts: "/posts",
  postEditor: "/posts/editor",
  postEdit: (id: string) => `/posts/editor/${id}`,
  dicts: "/dicts",
  media: "/media",
  audit: "/audit",
  logins: "/logins",
  system: "/system",
  errors: "/errors",
  team: "/team",
  profile: "/profile",
  moderation: "/moderation",
  denied: "/denied",
} as const;


/** Login page that brings the operator back to `path` (with its filters) after signing in. */
export const loginFor = (path: string) =>
  path === routes.home || path.startsWith(routes.login) ? routes.login : `${routes.login}?next=${encodeURIComponent(path)}`;

/**
 * Where to go after signing in: the `?next=` of the login page if it is a path inside the panel.
 * Anything else («//evil.com», «https://…», «/\evil.com») falls back to home, so the link cannot redirect off-site.
 */
export const afterLogin = (search: string) => {
  const next = new URLSearchParams(search).get("next");
  return next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") && !next.startsWith(routes.login) ? next : routes.home;
};
