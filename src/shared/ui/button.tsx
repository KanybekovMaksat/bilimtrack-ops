import type { ButtonHTMLAttributes } from "react";
import { cn } from "../lib";

const variants = {
  primary: "bg-brand text-white hover:bg-brand-hover",
  secondary: "border border-line bg-surface text-fg hover:bg-muted",
  ghost: "text-fg-muted hover:bg-muted hover:text-fg",
  danger: "bg-danger text-white hover:opacity-90",
};

const sizes = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  icon: "size-9 justify-center",
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
};

export function Button({ variant = "primary", size = "md", className, type = "button", ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex cursor-pointer items-center gap-2 rounded-lg font-medium transition-colors disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}
