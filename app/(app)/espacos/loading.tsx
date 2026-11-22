import { Skeleton } from "@/components/ui/skeleton";

function Block({ className = "" }: { className?: string }) {
  return <Skeleton className={`orbital-skeleton ${className}`} />;
}

export default function WorkspacesLoading() {
  return (
    <div aria-label="Carregando espa?os e pessoas" aria-busy="true" className="grid min-w-0 gap-6">
      <header className="grid gap-3">
        <Block className="h-3 w-28" />
        <Block className="h-8 w-64 max-w-full" />
        <Block className="h-4 w-80 max-w-full" />
      </header>
      <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(280px,1fr)]">
        <div className="grid content-start gap-5">
          <section className="grid gap-4 rounded-xl border border-border bg-surface p-4">
            <Block className="h-5 w-36" />
            {[0, 1, 2, 3].map((item) => (
              <div key={item} className="flex flex-wrap items-center gap-3 border-t border-border pt-3">
                <Block className="size-10 rounded-full" />
                <div className="grid min-w-0 flex-1 gap-2"><Block className="h-3.5 w-36 max-w-full" /><Block className="h-3 w-48 max-w-full" /></div>
                <Block className="h-7 w-20 rounded-full" />
              </div>
            ))}
          </section>
          <section className="grid gap-3 rounded-xl border border-border bg-surface p-4">
            <Block className="h-5 w-48" />
            {[0, 1, 2].map((item) => <div key={item} className="grid gap-2"><Block className="h-3.5 w-28" /><Block className="h-3 w-full" /></div>)}
          </section>
        </div>
        <aside className="grid content-start gap-5">
          {[0, 1, 2].map((item) => (
            <section key={item} className="grid gap-3 rounded-xl border border-border bg-surface p-4">
              <Block className="h-5 w-36" /><Block className="h-11 w-full rounded-md" /><Block className="h-11 w-full rounded-md" />
            </section>
          ))}
        </aside>
      </div>
    </div>
  );
}
