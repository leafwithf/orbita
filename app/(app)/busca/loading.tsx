import { Skeleton } from "@/components/ui/skeleton";

function Block({ className = "" }: { className?: string }) {
  return <Skeleton className={`orbital-skeleton ${className}`} />;
}

export default function SearchLoading() {
  return (
    <div aria-label="Carregando busca" aria-busy="true" className="grid min-w-0 gap-6">
      <header className="grid gap-3">
        <Block className="h-8 w-32" />
        <Block className="h-4 w-80 max-w-full" />
      </header>
      <div className="flex gap-2">
        <Block className="h-11 min-w-0 flex-1 rounded-md" />
        <Block className="h-11 w-24 rounded-md" />
      </div>
      <div className="grid gap-5">
        {[0, 1, 2].map((group) => (
          <section key={group} className="overflow-hidden rounded-xl border border-border bg-surface">
            <div className="border-b border-border p-4"><Block className="h-4 w-36" /></div>
            {[0, 1, 2].map((item) => (
              <div key={item} className="grid gap-2 border-b border-border p-4 last:border-0">
                <Block className="h-4 w-3/5 max-w-full" />
                <Block className="h-3 w-4/5 max-w-full" />
              </div>
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}
