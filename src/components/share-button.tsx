"use client";

import { Share2 } from "lucide-react";
import { shareLink } from "@/lib/share";
import { cn } from "@/lib/utils";

interface ShareButtonProps {
  path: string;
  title: string;
  text?: string;
  label?: string;
  labelClassName?: string;
  className?: string;
  iconClassName?: string;
}

export function ShareButton({
  path,
  title,
  text,
  label,
  labelClassName,
  className,
  iconClassName,
}: ShareButtonProps) {
  return (
    <button
      type="button"
      onClick={() => void shareLink({ title, text, url: path })}
      aria-label={label ? undefined : `Share ${title}`}
      className={cn(
        "inline-flex items-center justify-center gap-2 transition",
        className
      )}
    >
      <Share2 className={cn("h-4.5 w-4.5", iconClassName)} />
      {label ? <span className={labelClassName}>{label}</span> : null}
    </button>
  );
}
