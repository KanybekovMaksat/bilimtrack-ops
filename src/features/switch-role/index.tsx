import { useNavigate } from "react-router";
import { useSession, type StaffRole } from "@/entities/session";
import { routes } from "@/shared/config";
import { Segmented } from "@/shared/ui";

/** Demo-only switch between the "admin" and "content" staff roles. */
export function RoleSwitcher() {
  const role = useSession((s) => s.role);
  const setRole = useSession((s) => s.setRole);
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-1.5 border-t border-neutral-100 px-1 pt-2.5">
      <div className="px-1.5 text-[10px] font-semibold tracking-[.06em] text-neutral-400 uppercase">Демо: роль</div>
      <Segmented<StaffRole>
        size="sm"
        stretch
        value={role}
        onChange={(r) => {
          setRole(r);
          navigate(routes.home);
        }}
        options={[
          { value: "admin", label: "Админ" },
          { value: "content", label: "Контент" },
        ]}
      />
    </div>
  );
}
