import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const variants = {
  primary:
    "rounded-sm bg-fg text-bg hover:bg-white transition-all hover:-translate-y-px active:translate-y-0",
  default:
    "rounded-sm bg-fg text-bg hover:bg-white transition-all hover:-translate-y-px active:translate-y-0",
  glass: "mm-glass rounded-sm text-fg hover:bg-fg/10 transition-colors",
  secondary:
    "rounded-sm border border-line bg-panel-2/80 text-fg hover:bg-panel-3 active:scale-[0.98]",
  ghost: "rounded-sm text-fg hover:bg-fg/5",
  outline:
    "rounded-sm border border-line-2 text-fg hover:bg-panel-2 active:scale-[0.98]",
  danger:
    "rounded-sm bg-danger/15 text-danger border border-danger/25 hover:bg-danger/25",
  gold: "rounded-sm bg-amber/15 text-amber border border-amber/25 hover:bg-amber/25",
} as const;

const sizes = {
  sm: "h-9 px-3.5 text-sm gap-1.5",
  md: "h-11 px-5 text-sm gap-2",
  lg: "h-12 px-6 text-base gap-2",
  icon: "h-9 w-9 rounded-full",
} as const;

type Variant = keyof typeof variants;
type Size = keyof typeof sizes;

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex cursor-pointer select-none items-center justify-center font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember/60 disabled:pointer-events-none disabled:opacity-50",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
