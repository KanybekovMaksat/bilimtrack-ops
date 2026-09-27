import { Avatar } from "@/shared/ui";
import type { Employee } from "../model/types";

export function EmployeeChip({ employee }: { employee?: Employee }) {
  if (!employee) return <span className="text-sm text-fg-subtle">Не назначен</span>;
  return (
    <span className="inline-flex items-center gap-2 text-sm">
      <Avatar name={employee.name} className="size-6 text-[10px]" />
      {employee.name}
    </span>
  );
}
