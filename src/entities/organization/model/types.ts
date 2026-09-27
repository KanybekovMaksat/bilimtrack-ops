export type OrganizationType = "university" | "college" | "school";
export type OrganizationPlan = "start" | "pro" | "enterprise";
export type OrganizationStatus = "active" | "trial" | "churned";

export type Organization = {
  id: string;
  name: string;
  city: string;
  type: OrganizationType;
  plan: OrganizationPlan;
  status: OrganizationStatus;
  students: number;
  contactName: string;
  createdAt: string;
};

export const organizationTypeLabel: Record<OrganizationType, string> = {
  university: "Университет",
  college: "Колледж",
  school: "Школа",
};

export const organizationPlanLabel: Record<OrganizationPlan, string> = {
  start: "Start",
  pro: "Pro",
  enterprise: "Enterprise",
};
