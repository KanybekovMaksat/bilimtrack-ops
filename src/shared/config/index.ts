export const routes = {
  login: "/login",
  dashboard: "/",
  tickets: "/tickets",
  ticket: (id: string) => `/tickets/${id}`,
  organizations: "/organizations",
  services: "/services",
} as const;
