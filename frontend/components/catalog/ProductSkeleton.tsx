export function ProductSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border border-black/10 bg-white">
      <div className="aspect-[4/3] animate-pulse bg-black/10" />
      <div className="space-y-3 p-3">
        <div className="h-3 w-20 animate-pulse rounded bg-black/10" />
        <div className="h-4 w-full animate-pulse rounded bg-black/10" />
        <div className="h-4 w-24 animate-pulse rounded bg-black/10" />
        <div className="h-11 animate-pulse rounded-lg bg-black/10" />
      </div>
    </div>
  );
}
