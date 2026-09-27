import type { ButtonHTMLAttributes } from "react";
import { cn } from "../lib";
import { Icon, type IconName } from "./icon";

const variants = {
  primary: "border border-transparent bg-brand text-white hover:bg-brand-hover",
  outline: "border border-neutral-200 bg-white text-ink hover:bg-neutral-100",
  muted: "border border-neutral-200 bg-white text-neutral-500 hover:bg-neutral-100",
  danger: "border border-transparent bg-red-500 text-white hover:bg-red-600",
  dangerOutline: "border border-red-500 bg-white text-red-600 hover:bg-red-50",
  ghost: "border border-transparent bg-transparent text-neutral-500 hover:text-ink",
  inverse: "border border-white/20 bg-transparent text-white hover:bg-white/10",
};

const sizes = {
  xs: "h-[30px] px-3 text-xs gap-1.5",
  sm: "h-8 px-3.5 text-[13px] gap-1.5",
  md: "h-[34px] px-3.5 text-[13px] gap-1.5",
  lg: "h-9 px-4 text-sm gap-[7px]",
  xl: "h-10 px-[18px] text-sm gap-[7px]",
  "2xl": "h-11 px-5 text-base gap-2",
};

const iconOnly = { xs: "w-[30px]", sm: "w-8", md: "w-[34px]", lg: "w-9", xl: "w-10", "2xl": "w-11" };
const iconSize = { xs: 15, sm: 16, md: 16, lg: 17, xl: 18, "2xl": 18 };

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  icon?: IconName;
  iconRight?: IconName;
};

export function Button({
  variant = "outline",
  size = "lg",
  icon,
  iconRight,
  className,
  children,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-medium whitespace-nowrap transition-colors disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        !children && cn(iconOnly[size], "px-0"),
        className,
      )}
      {...props}
    >
      {icon && <Icon name={icon} size={iconSize[size]} />}
      {children}
      {iconRight && <Icon name={iconRight} size={iconSize[size] - 1} />}
    </button>
  );
}
