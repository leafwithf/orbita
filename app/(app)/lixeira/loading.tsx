import { Skeleton } from "@/components/ui/skeleton";

function Block({ className = "" }: { className?: string }) {
  return <Skeleton className={`orbital-skeleton ${className}`} />;
}

export default function TrashLoading() {
  return (
    <div aria-label="Carregando lixeira" aria-busy="true" className="grid min-w-0 gap-6">
      <header className="grid gap-3"><Block className="h-8 w-32" /><Block className="h-4 w-80 max-w-full" /></header>
      <section className="orbita-panel overflow-hidden rounded-xl border border-border bg-surface">
        <div className="border-b border-border p-4"><Block className="h-4 w-24" /></div>
        {[0, 1, 2, 3, 4].map((item) => (
          <div key={item} className="flex flex-wrap items-center gap-3 border-b border-border p-4 last:border-0">
            <div className="grid min-w-0 flex-1 gap-2"><Block className="h-3.5 w-48 max-w-full" /><Block className="h-3 w-56 max-w-full" /></div>
            <Block className="h-11 w-24 rounded-md" />
          </div>
        ))}
      </section>
    </div>
  );
}
