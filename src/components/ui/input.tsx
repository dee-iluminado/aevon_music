import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "h-11 w-full rounded-xl border border-line bg-panel-2/80 px-4 text-sm text-fg placeholder:text-dim focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors",
      className
    )}
    {...props}
  />
));
Input.displayName = "Input";
