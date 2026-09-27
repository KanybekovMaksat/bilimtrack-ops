/* Client organizations across the platform.
   Backend: server/apps/ops (use_cases/organizations.py), /api/v1/ops/organizations/. */

export type OrgStatus = "active" | "inactive" | "archived";

export const orgStatusLabel: Record<OrgStatus, string> = {
  active: "Активна",
  inactive: "Неактивна",
  archived: "В архиве",
};

/** Ops category: `beta` organizations stay out of the main metrics on the home page. */
export type OrgCategory = "client" | "beta";

export const orgCategoryLabel: Record<OrgCategory, string> = { client: "Клиент", beta: "Beta" };

export const ORG_TIMEZONES: { value: string; label: string }[] = [
  { value: "Asia/Bishkek", label: "Бишкек (UTC+6)" },
  { value: "Asia/Almaty", label: "Алматы (UTC+5)" },
  { value: "Asia/Tashkent", label: "Ташкент (UTC+5)" },
  { value: "Asia/Dushanbe", label: "Душанбе (UTC+5)" },
  { value: "Asia/Aqtau", label: "Актау (UTC+5)" },
  { value: "UTC", label: "UTC" },
];

export const ORG_LOCALES: { value: string; label: string }[] = [
  { value: "ru", label: "Русский" },
  { value: "ky", label: "Кыргызский" },
  { value: "en", label: "Английский" },
];

export const ORG_TYPES: { value: string; label: string }[] = [
  { value: "university", label: "Университет" },
  { value: "college", label: "Колледж" },
  { value: "school", label: "Школа" },
  { value: "course_center", label: "Учебный центр" },
  { value: "tutor", label: "Репетитор" },
];

export type LicenseBrief = {
  plan: string;
  planLabel: string;
  licensedModules: string[];
  validFrom: string | null;
  validUntil: string | null;
  note: string;
  updatedAt: string;
};

/** OrganizationSerializer. */
export type Organization = {
  id: number;
  name: string;
  shortName: string;
  legalName: string;
  slug: string;
  type: string;
  typeLabel: string;
  status: OrgStatus;
  statusLabel: string;
  /** Missing on an older backend: treated as `client`. */
  category?: OrgCategory;
  categoryLabel?: string;
  logo: string | null;
  owner: { id: number; username: string } | null;
  learnersCount: number;
  employeesCount: number;
  guardiansCount: number;
  branchesCount: number;
  membersCount: number;
  openTicketsCount: number;
  enabledModules: string[];
  license: LicenseBrief | null;
  lastActivityAt: string | null;
  createdAt: string;
};

export type OrgModuleState = { code: string; name: string; description: string; isEnabled: boolean; isLicensed: boolean | null };
export type OrgSettingState = { code: string; label: string; isEnabled: boolean };
export type OrgBranch = { id: number; name: string; type: string; typeLabel: string; parentId: number | null; status: string };
export type OrgUnit = { id: number; name: string; type: string; typeLabel: string; parentId: number | null; branchId: number | null };

/** OrganizationDetailSerializer. */
export type OrganizationDetail = Organization & {
  email: string;
  phone: string;
  website: string;
  address: string;
  timezone: string;
  locale: string;
  country: string;
  taxId: string;
  archivedAt: string | null;
  modules: OrgModuleState[];
  settings: OrgSettingState[];
  branches: OrgBranch[];
  academicUnits: OrgUnit[];
};

/** Editable organization fields (PATCH ops/organizations/:id/). */
export type OrganizationInput = Partial<{
  name: string;
  shortName: string;
  legalName: string;
  slug: string;
  type: string;
  timezone: string;
  locale: string;
  country: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  taxId: string;
  status: OrgStatus;
  category: OrgCategory;
}>;

export type OwnerInput = {
  mode: "none" | "existing" | "new";
  username?: string;
  email?: string;
  phone?: string;
  lastName?: string;
  firstName?: string;
  middleName?: string;
  positionTitle?: string;
};

export type OrganizationCreateInput = OrganizationInput & {
  name: string;
  type: string;
  branchName?: string;
  branchAddress?: string;
  plan?: string | null;
  applyPlanModules?: boolean;
  owner?: OwnerInput;
};

export type Credentials = { username: string; password: string };

/** A role that can be granted in an organization. */
export type OrgRole = { id: number; code: string; name: string; description: string; isSystem: boolean };

export type PersonKind = "employee" | "learner" | "existing";

export type PersonInput = {
  kind: PersonKind;
  lastName?: string;
  firstName?: string;
  middleName?: string;
  positionTitle?: string;
  email?: string;
  phone?: string;
  username?: string;
  roleIds?: number[];
  branchId?: number | null;
};

export type PersonCreated = {
  kind: PersonKind;
  profileId: number | null;
  fullName: string;
  userId: number;
  username: string;
  password: string | null;
  membershipId: number;
  roles: string[];
};

/** GET ops/summary/: numbers for the home page, beta organizations excluded. */
export type PlatformSummary = {
  organizations: { total: number; active: number; inactive: number; archived: number; beta: number };
  users: { total: number; inClients: number; active30d: number; learners: number; employees: number; operators: number };
};

export const orgCategory = (o: Pick<Organization, "category">): OrgCategory => o.category ?? "client";

/** OrganizationMemberSerializer. */
export type OrgMember = {
  id: number;
  user: { id: number; username: string; email: string; phone: string; isActive: boolean; lastLogin: string | null };
  fullName: string;
  status: string;
  isDefault: boolean;
  isOwner: boolean;
  roles: { id: number; code: string; name: string }[];
  createdAt: string;
};

/** Days without a sign-in after which an organization is flagged as quiet. */
export const STALE_DAYS = 14;

export const isStale = (o: Pick<Organization, "lastActivityAt" | "status">, now = Date.now()) =>
  o.status === "active" && (!o.lastActivityAt || now - new Date(o.lastActivityAt).getTime() > STALE_DAYS * 86_400_000);

export const orgMark = (o: Pick<Organization, "shortName" | "name">) => {
  const src = (o.shortName || o.name).replace(/[«»"'№()]/g, "").trim();
  const words = src.split(/\s+/).filter(Boolean);
  return (words.length > 1 ? words.slice(0, 2).map((w) => w[0]).join("") : src.slice(0, 2)).toUpperCase() || "?";
};

/** Branches and academic units as one indented tree (branches first, units under their branch). */
export function structureTree(detail: Pick<OrganizationDetail, "branches" | "academicUnits">) {
  type Node = { key: string; level: number; name: string; kind: string; icon: string };
  const out: Node[] = [];
  const walkUnits = (parentId: number | null, branchId: number | null, level: number) => {
    for (const u of detail.academicUnits.filter((x) => x.parentId === parentId && (parentId !== null || x.branchId === branchId))) {
      out.push({ key: `u${u.id}`, level, name: u.name, kind: u.typeLabel, icon: "school" });
      walkUnits(u.id, branchId, level + 1);
    }
  };
  const walkBranches = (parentId: number | null, level: number) => {
    for (const b of detail.branches.filter((x) => x.parentId === parentId)) {
      out.push({ key: `b${b.id}`, level, name: b.name, kind: b.typeLabel, icon: "building-community" });
      walkBranches(b.id, level + 1);
      walkUnits(null, b.id, level + 1);
    }
  };
  walkBranches(null, 0);
  walkUnits(null, null, 0);
  return out;
}
