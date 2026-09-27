import { useState } from "react";
import { Link } from "react-router";
import { Search } from "lucide-react";
import {
  OrganizationStatusBadge,
  organizationPlanLabel,
  organizationTypeLabel,
  useOrganizations,
} from "@/entities/organization";
import { routes } from "@/shared/config";
import { formatNumber } from "@/shared/lib";
import { Badge, EmptyState, Input, Spinner } from "@/shared/ui";

export function OrganizationsTable() {
  const { data: organizations, isPending, isError } = useOrganizations();
  const [query, setQuery] = useState("");

  if (isPending) return <Spinner />;
  if (isError) return <EmptyState title="Не удалось загрузить организации" />;

  const q = query.trim().toLowerCase();
  const rows = organizations.filter((o) => !q || o.name.toLowerCase().includes(q) || o.city.toLowerCase().includes(q));

  return (
    <>
      <div className="border-b border-line p-4">
        <div className="relative max-w-sm">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-fg-subtle" />
          <Input className="pl-9" placeholder="Название или город" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
      </div>
      {rows.length === 0 ? (
        <EmptyState title="Ничего не найдено" />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-fg-muted">
              <tr className="border-b border-line">
                <th className="px-5 py-3 font-medium">Организация</th>
                <th className="px-5 py-3 font-medium">Тип</th>
                <th className="px-5 py-3 font-medium">Тариф</th>
                <th className="px-5 py-3 text-right font-medium">Студенты</th>
                <th className="px-5 py-3 font-medium">Контакт</th>
                <th className="px-5 py-3 font-medium">Статус</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((o) => (
                <tr key={o.id} className="border-b border-line last:border-0 hover:bg-muted/50">
                  <td className="px-5 py-3">
                    <p className="font-medium">{o.name}</p>
                    <p className="text-xs text-fg-muted">{o.city}</p>
                  </td>
                  <td className="px-5 py-3 text-fg-muted">{organizationTypeLabel[o.type]}</td>
                  <td className="px-5 py-3"><Badge tone={o.plan === "enterprise" ? "brand" : "neutral"}>{organizationPlanLabel[o.plan]}</Badge></td>
                  <td className="px-5 py-3 text-right tabular-nums">{formatNumber(o.students)}</td>
                  <td className="px-5 py-3 whitespace-nowrap text-fg-muted">{o.contactName}</td>
                  <td className="px-5 py-3"><OrganizationStatusBadge status={o.status} /></td>
                  <td className="px-5 py-3 text-right whitespace-nowrap">
                    <Link to={`${routes.tickets}?org=${o.id}`} className="text-sm text-brand hover:underline">Тикеты →</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
