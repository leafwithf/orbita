import { Skeleton } from "@/components/ui/skeleton";

function Block({ className = "" }: { className?: string }) {
  return <Skeleton className={`orbital-skeleton ${className}`} />;
}

export default function TasksLoading() {
  return (
    <div aria-label="Carregando tarefas" aria-busy="true" className="grid min-w-0 gap-6">
      <header className="grid gap-3">
        <Block className="h-8 w-36" />
        <Block className="h-4 w-80 max-w-full" />
        <div className="flex flex-wrap gap-2">{[0, 1, 2, 3].map((item) => <Block key={item} className="h-9 w-24 rounded-full" />)}</div>
      </header>
      {[0, 1].map((section) => (
        <section key={section} className="overflow-hidden rounded-xl border border-border bg-surface">
          <div className="border-b border-border p-4"><Block className="h-4 w-40" /></div>
          <div className="divide-y divide-border">
            {[0, 1, 2].map((item) => (
              <div key={item} className="flex items-center gap-3 p-4">
                <Block className="size-5 rounded-md" />
                <div className="grid min-w-0 flex-1 gap-2"><Block className="h-3.5 w-3/5 max-w-full" /><Block className="h-3 w-2/5 max-w-full" /></div>
                <Block className="h-6 w-16 rounded-full" />
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
