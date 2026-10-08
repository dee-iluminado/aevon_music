import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Badge({
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border border-line bg-panel-2/80 px-2 py-0.5 text-[11px] font-medium text-sub",
        className
      )}
      {...props}
    />
  );
}

export function RatingBadge({
  value,
  className,
}: {
  value?: number;
  className?: string;
}) {
  if (value == null || value <= 0) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md bg-amber/15 px-2 py-0.5 text-[11px] font-semibold text-amber",
        className
      )}
    >
      <StarIcon className="h-3 w-3 fill-current" />
      {value.toFixed(1)}
    </span>
  );
}

export function StarIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M11.48 3.5c.16-.37.63-.37.8 0l2.03 4.51a.6.6 0 0 0 .48.35l4.96.5c.4.04.56.55.27.83l-3.74 3.4a.6.6 0 0 0-.18.56l.94 4.89c.08.4-.34.7-.69.5l-4.28-2.4a.6.6 0 0 0-.57 0l-4.28 2.4c-.35.2-.77-.1-.69-.5l.94-4.89a.6.6 0 0 0-.18-.56l-3.74-3.4a.6.6 0 0 1 .27-.83l4.96-.5a.6.6 0 0 0 .48-.35z"
      />
    </svg>
  );
}
