import { Skeleton } from "@/components/ui/skeleton";

function Block({ className = "" }: { className?: string }) {
  return <Skeleton className={`orbital-skeleton ${className}`} />;
}

export default function BacklogLoading() {
  return (
    <div aria-label="Carregando ideias" aria-busy="true" className="grid min-w-0 gap-6">
      <header className="grid gap-3"><Block className="h-8 w-56" /><Block className="h-4 w-80 max-w-full" /></header>
      <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(290px,1fr)]">
        <div className="grid content-start gap-3">{[0, 1, 2].map((item) => <section key={item} className="grid gap-3 rounded-lg border border-border bg-surface p-4"><div className="flex gap-2"><Block className="h-6 w-28 rounded-full" /><Block className="h-6 w-24 rounded-full" /></div><Block className="h-4 w-3/4" /><Block className="h-3 w-full" /><Block className="h-3 w-2/3" /></section>)}</div>
        <aside className="grid content-start gap-5"><section className="grid gap-3 rounded-xl border border-border bg-surface p-4"><Block className="h-5 w-40" /><Block className="h-3 w-full" /><Block className="h-3 w-4/5" /><Block className="h-3 w-5/6" /></section></aside>
      </div>
    </div>
  );
}
