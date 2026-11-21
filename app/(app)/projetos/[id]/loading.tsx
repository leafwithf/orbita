import { Skeleton } from "@/components/ui/skeleton";

function Block({ className = "" }: { className?: string }) {
  return <Skeleton className={`orbital-skeleton ${className}`} />;
}

export default function ProjectDetailLoading() {
  return (
    <div aria-label="Carregando projeto" aria-busy="true" className="grid min-w-0 gap-6">
      <Block className="h-4 w-36" />
      <header className="grid gap-3"><Block className="h-3 w-24" /><Block className="h-9 w-72 max-w-full" /><Block className="h-4 w-80 max-w-full" /></header>
      <div className="flex flex-wrap gap-2"><Block className="h-7 w-24 rounded-full" /><Block className="h-7 w-28 rounded-full" /><Block className="h-7 w-24 rounded-full" /></div>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(280px,1fr)]">
        <div className="grid content-start gap-5"><section className="grid gap-3 rounded-xl border border-border bg-surface p-4"><Block className="h-5 w-36" /><Block className="h-3 w-full" /><Block className="h-3 w-4/5" /></section><section className="grid gap-3 rounded-xl border border-border bg-surface p-4"><Block className="h-5 w-32" />{[0, 1, 2].map((item) => <div key={item} className="flex gap-3 border-t border-border pt-3"><Block className="size-5 rounded-md" /><div className="grid flex-1 gap-2"><Block className="h-3.5 w-3/5" /><Block className="h-3 w-2/5" /></div></div>)}</section></div>
        <aside className="grid content-start gap-5"><section className="grid gap-3 rounded-xl border border-border bg-surface p-4"><Block className="h-5 w-28" /><Block className="h-2 w-full rounded-full" /><Block className="h-3 w-3/4" /></section></aside>
      </div>
    </div>
  );
}
