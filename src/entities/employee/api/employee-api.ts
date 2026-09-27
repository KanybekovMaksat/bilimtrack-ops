import { useQuery } from "@tanstack/react-query";
import { delay } from "@/shared/api";
import type { Employee } from "../model/types";

const employees: Employee[] = [
  { id: "emp-1", name: "Максат Каныбеков", email: "maksat@bilimtrack.kg", role: "manager" },
  { id: "emp-2", name: "Айжан Мураталиева", email: "aizhan@bilimtrack.kg", role: "support" },
  { id: "emp-3", name: "Дастан Исаков", email: "dastan@bilimtrack.kg", role: "engineer" },
  { id: "emp-4", name: "Элнура Садыкова", email: "elnura@bilimtrack.kg", role: "support" },
  { id: "emp-5", name: "Руслан Орозбеков", email: "ruslan@bilimtrack.kg", role: "devops" },
];

export const employeeApi = {
  list: () => delay(employees),
};

export const employeeKeys = { all: ["employees"] as const };

export const useEmployees = () => useQuery({ queryKey: employeeKeys.all, queryFn: employeeApi.list });

export const useEmployeeMap = () =>
  useQuery({
    queryKey: employeeKeys.all,
    queryFn: employeeApi.list,
    select: (list) => new Map(list.map((e) => [e.id, e])),
  });
