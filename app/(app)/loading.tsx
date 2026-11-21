import { Skeleton } from "@/components/ui/skeleton";

function SkeletonBlock({ className = "" }: { className?: string }) {
  return <Skeleton className={className} />;
}

/** Shared route-level loading state for the authenticated workspace. */
export default function WorkspaceLoading() {
  return (
    <div
      aria-label="Carregando espaço de trabalho"
      aria-busy="true"
      className="grid min-w-0 gap-6"
    >
      <div className="grid gap-2">
        <SkeletonBlock className="h-3 w-28" />
        <SkeletonBlock className="h-8 w-56 max-w-full" />
        <SkeletonBlock className="h-4 w-72 max-w-full" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <div
            key={index}
            className="grid gap-3 rounded-xl border border-border bg-surface p-4"
          >
            <div className="flex items-center gap-3">
              <SkeletonBlock className="size-10 rounded-xl" />
              <div className="grid flex-1 gap-2">
                <SkeletonBlock className="h-3.5 w-2/3" />
                <SkeletonBlock className="h-3 w-1/3" />
              </div>
            </div>
            <SkeletonBlock className="h-3 w-full" />
            <SkeletonBlock className="h-3 w-4/5" />
            <SkeletonBlock className="mt-2 h-2 w-full rounded-full" />
          </div>
        ))}
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1.5fr)_minmax(260px,1fr)]">
        <div className="grid gap-3 rounded-xl border border-border bg-surface p-4">
          <SkeletonBlock className="h-4 w-32" />
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="flex items-center gap-3 py-2">
              <SkeletonBlock className="size-5 rounded-full" />
              <div className="grid flex-1 gap-2">
                <SkeletonBlock className="h-3.5 w-3/5" />
                <SkeletonBlock className="h-3 w-2/5" />
              </div>
              <SkeletonBlock className="h-6 w-16 rounded-full" />
            </div>
          ))}
        </div>
        <div className="grid content-start gap-3 rounded-xl border border-border bg-surface p-4">
          <SkeletonBlock className="h-4 w-36" />
          <SkeletonBlock className="h-20 w-full rounded-lg" />
          <SkeletonBlock className="h-10 w-full rounded-lg" />
          <SkeletonBlock className="h-10 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}
