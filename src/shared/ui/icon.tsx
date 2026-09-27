import type { CSSProperties } from "react";
import { cn } from "../lib";

type IconProps = {
  /** Tabler icon name without the `ti-` prefix, e.g. "lifebuoy". */
  name: string;
  size?: number;
  className?: string;
  style?: CSSProperties;
};

/** Tabler icon from the webfont — the design system's canonical icon set. */
export function Icon({ name, size, className, style }: IconProps) {
  return <i aria-hidden className={cn("ti", `ti-${name}`, className)} style={{ fontSize: size, ...style }} />;
}
