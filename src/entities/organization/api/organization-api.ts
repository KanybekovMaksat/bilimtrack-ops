import { delay, notFound } from "@/shared/api";
import type { Organization } from "../model/types";

const organizations: Organization[] = [
  { id: "org-1", name: "КНУ им. Ж. Баласагына", city: "Бишкек", type: "university", plan: "enterprise", status: "active", students: 18400, contactName: "Айгуль Сатыбалдиева", createdAt: "2025-09-01T09:00:00Z" },
  { id: "org-2", name: "КГТУ им. И. Раззакова", city: "Бишкек", type: "university", plan: "enterprise", status: "active", students: 12650, contactName: "Эрлан Токтосунов", createdAt: "2025-10-12T09:00:00Z" },
  { id: "org-3", name: "Ошский государственный университет", city: "Ош", type: "university", plan: "pro", status: "active", students: 9800, contactName: "Бакыт Жумабаев", createdAt: "2026-01-20T09:00:00Z" },
  { id: "org-4", name: "Бишкекский колледж ИТ", city: "Бишкек", type: "college", plan: "pro", status: "active", students: 1450, contactName: "Нурлан Абдыкадыров", createdAt: "2026-02-03T09:00:00Z" },
  { id: "org-5", name: "Каракольский педагогический колледж", city: "Каракол", type: "college", plan: "start", status: "trial", students: 620, contactName: "Жибек Осмонова", createdAt: "2026-08-28T09:00:00Z" },
  { id: "org-6", name: "Лицей «Илим»", city: "Бишкек", type: "school", plan: "start", status: "active", students: 540, contactName: "Азамат Кененсариев", createdAt: "2026-03-15T09:00:00Z" },
  { id: "org-7", name: "Джалал-Абадский университет", city: "Джалал-Абад", type: "university", plan: "pro", status: "trial", students: 5300, contactName: "Гульнара Мамытова", createdAt: "2026-09-10T09:00:00Z" },
  { id: "org-8", name: "Нарынский колледж экономики", city: "Нарын", type: "college", plan: "start", status: "churned", students: 380, contactName: "Талант Бейшеев", createdAt: "2025-11-05T09:00:00Z" },
];

export const organizationApi = {
  list: () => delay(organizations),
  get: (id: string) => {
    const org = organizations.find((o) => o.id === id);
    return org ? delay(org) : notFound("Организация", id);
  },
};
