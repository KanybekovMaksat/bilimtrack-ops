export type EmployeeRole = "support" | "engineer" | "devops" | "manager";

export type Employee = {
  id: string;
  name: string;
  email: string;
  role: EmployeeRole;
};

export const employeeRoleLabel: Record<EmployeeRole, string> = {
  support: "Поддержка",
  engineer: "Инженер",
  devops: "DevOps",
  manager: "Менеджер",
};
