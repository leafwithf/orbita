import { Skeleton } from "@/components/ui/skeleton";

function Block({ className = "" }: { className?: string }) {
  return <Skeleton className={`orbital-skeleton ${className}`} />;
}

export default function HistoryLoading() {
  return (
    <div aria-label="Carregando histórico" aria-busy="true" className="grid min-w-0 gap-6">
      <header className="grid gap-3"><Block className="h-8 w-40" /><Block className="h-4 w-80 max-w-full" /></header>
      <section className="orbita-panel overflow-hidden rounded-xl border border-border bg-surface">
        <div className="border-b border-border p-4"><Block className="h-4 w-40" /></div>
        {[0, 1, 2, 3, 4, 5, 6].map((item) => (
          <div key={item} className="flex flex-wrap items-center gap-3 border-b border-border p-4 last:border-0">
            <Block className="size-8 shrink-0 rounded-full" />
            <div className="grid min-w-0 flex-1 gap-2"><Block className="h-3.5 w-3/5 max-w-full" /><Block className="h-3 w-2/5 max-w-full" /></div>
            <Block className="h-3 w-24" />
          </div>
        ))}
      </section>
    </div>
  );
}
