import Image from "next/image";
import { cn } from "@/lib/utils";

interface CoverProps {
  src?: string;
  alt: string;
  className?: string;
  imgClassName?: string;
  priority?: boolean;
}

export function Cover({ src, alt, className, imgClassName, priority }: CoverProps) {
  if (!src) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-gradient-to-b from-panel-2 to-panel text-dim",
          className
        )}
      >
        <MusicGlyph />
      </div>
    );
  }
  return (
    <div className={cn("relative overflow-hidden", className)}>
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes="(max-width: 768px) 50vw, 300px"
        className={cn("object-cover", imgClassName)}
        unoptimized
      />
    </div>
  );
}

function MusicGlyph() {
  return (
    <svg width="40%" height="40%" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  );
}
