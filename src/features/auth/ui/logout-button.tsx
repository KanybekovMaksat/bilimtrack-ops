import { LogOut } from "lucide-react";
import { useSessionStore } from "@/entities/session";
import { Button } from "@/shared/ui";

export function LogoutButton() {
  const clear = useSessionStore((s) => s.clear);
  return (
    <Button variant="ghost" size="icon" onClick={clear} aria-label="Выйти" title="Выйти">
      <LogOut className="size-4" />
    </Button>
  );
}
