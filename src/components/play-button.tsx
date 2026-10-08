import { Play } from "lucide-react";
import { cn } from "@/lib/utils";

export function PlayingBars({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-end gap-[3px]", className)} aria-hidden>
      <span
        className="w-[3px] animate-eq rounded-full bg-accent"
        style={{ height: "100%", transformOrigin: "bottom", animationDelay: "0s" }}
      />
      <span
        className="w-[3px] animate-eq rounded-full bg-accent"
        style={{ height: "100%", transformOrigin: "bottom", animationDelay: "-0.3s" }}
      />
      <span
        className="w-[3px] animate-eq rounded-full bg-accent"
        style={{ height: "100%", transformOrigin: "bottom", animationDelay: "-0.6s" }}
      />
      <span
        className="w-[3px] animate-eq rounded-full bg-accent"
        style={{ height: "100%", transformOrigin: "bottom", animationDelay: "-0.15s" }}
      />
    </span>
  );
}

export function PlayCircle({
  className,
  onClick,
  label = "Play",
}: {
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
  label?: string;
}) {
  return (
    <button
      aria-label={label}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick?.(e);
      }}
      className={cn(
        "flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-black/50 text-white shadow-lg backdrop-blur-sm transition-transform hover:scale-105 active:scale-95",
        className
      )}
    >
      <Play className="ml-0.5 h-5 w-5 fill-current" />
    </button>
  );
}
