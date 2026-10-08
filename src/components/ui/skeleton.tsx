import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return <div className={cn("skeleton rounded-sm", className)} />;
}

export function SongCardSkeleton() {
  return (
    <div className="w-40 shrink-0 space-y-2 sm:w-44">
      <Skeleton className="aspect-square w-full" />
      <Skeleton className="h-3.5 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  );
}

export function RowSkeleton() {
  return (
    <div className="flex items-center gap-3 px-2 py-2.5">
      <Skeleton className="h-10 w-10 rounded-lg" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3.5 w-2/5" />
        <Skeleton className="h-3 w-1/4" />
      </div>
      <Skeleton className="h-3 w-8" />
    </div>
  );
}
