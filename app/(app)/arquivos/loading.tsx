import { Skeleton } from "@/components/ui/skeleton";

function Block({ className = "" }: { className?: string }) {
  return <Skeleton className={`orbital-skeleton ${className}`} />;
}

export default function FilesLoading() {
  return (
    <div aria-label="Carregando arquivos" aria-busy="true" className="grid min-w-0 gap-6">
      <header className="grid gap-2"><Block className="h-8 w-36" /><Block className="h-4 w-80 max-w-full" /></header>
      <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(290px,1fr)]">
        <div className="grid min-w-0 content-start gap-5">
          <section className="orbita-panel grid gap-4 rounded-xl border border-border bg-surface p-4">
            <Block className="h-5 w-44" /><Block className="h-24 w-full rounded-lg" />
            {[0, 1, 2, 3].map((item) => (
              <div key={item} className="flex items-center gap-3 border-t border-border pt-3">
                <Block className="size-9 rounded-md" />
                <div className="grid min-w-0 flex-1 gap-2"><Block className="h-3.5 w-3/5 max-w-full" /><Block className="h-3 w-2/5 max-w-full" /></div>
                <Block className="h-7 w-16 rounded-md" />
              </div>
            ))}
          </section>
          <section className="orbita-panel grid gap-3 rounded-xl border border-border bg-surface p-4"><Block className="h-5 w-48" /><Block className="h-3 w-full" /><Block className="h-3 w-4/5" /></section>
        </div>
        <aside className="grid content-start gap-5"><section className="orbita-panel grid gap-3 rounded-xl border border-border bg-surface p-4"><Block className="h-5 w-28" /><Block className="h-7 w-32" /><Block className="h-2 w-full rounded-full" /><Block className="h-3 w-3/4" /></section></aside>
      </div>
    </div>
  );
}
