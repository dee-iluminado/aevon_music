import { RowSkeleton, Skeleton } from "@/components/ui/skeleton";

/**
 * Shared placeholder for the detail routes (album / artist / song / playlist)
 * while their data is being fetched on the server.
 */
export function DetailSkeleton() {
  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-6 pt-2 sm:flex-row sm:items-end">
        <Skeleton className="h-44 w-44 shrink-0 rounded-xl sm:h-52 sm:w-52" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-9 w-2/3 max-w-md" />
          <Skeleton className="h-3 w-40" />
          <Skeleton className="h-11 w-44 rounded-full" />
        </div>
      </div>
      <div className="space-y-1">
        {Array.from({ length: 8 }, (_, index) => (
          <RowSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}
