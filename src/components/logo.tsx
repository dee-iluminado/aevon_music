import Image from "next/image";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <Image
        src="/logo.png"
        alt="AEVON Music logo"
        width={28}
        height={28}
        priority
        className="h-8 w-auto object-contain"
      />
      <span className="font-mono text-[11px] font-medium uppercase tracking-[0.3em] text-fg">
        Music
      </span>
    </span>
  );
}
