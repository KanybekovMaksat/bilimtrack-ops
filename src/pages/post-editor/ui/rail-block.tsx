import type { ReactNode } from "react";
import { Icon, type IconName } from "@/shared/ui";

/** One titled section of the editor's right rail. */
export function RailBlock({ label, icon, children }: { label?: string; icon?: IconName; children: ReactNode }) {
  return (
    <div className="ae-block">
      {label && (
        <p className="ae-label">
          {icon && <Icon name={icon} size={15} />}
          {label}
        </p>
      )}
      {children}
    </div>
  );
}
