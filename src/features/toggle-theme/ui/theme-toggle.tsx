import { Moon, Sun } from "lucide-react";
import { Button } from "@/shared/ui";
import { useThemeStore } from "../model/theme-store";

export function ThemeToggle() {
  const { theme, toggle } = useThemeStore();
  return (
    <Button variant="ghost" size="icon" onClick={toggle} aria-label="Сменить тему" title="Сменить тему">
      {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  );
}
