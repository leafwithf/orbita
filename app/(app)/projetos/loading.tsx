import { Skeleton } from "@/components/ui/skeleton";

function Block({ className = "" }: { className?: string }) {
  return <Skeleton className={`orbital-skeleton ${className}`} />;
}

export default function ProjectsLoading() {
  return (
    <div aria-label="Carregando projetos" aria-busy="true" className="grid min-w-0 gap-7">
      <section className="grid gap-6 rounded-3xl border border-border bg-surface p-6 sm:p-8">
        <div className="grid gap-3">
          <Block className="h-3 w-32" />
          <Block className="h-9 w-[min(34rem,100%)]" />
          <Block className="h-4 w-[min(30rem,100%)]" />
        </div>
        <div className="grid grid-cols-3 gap-3 border-t border-border pt-5 sm:max-w-xl">
          {[0, 1, 2].map((item) => <div key={item} className="grid gap-2"><Block className="h-7 w-12" /><Block className="h-3 w-20 max-w-full" /></div>)}
        </div>
      </section>
      <section className="grid gap-4">
        <Block className="h-8 w-40" />
        <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div key={item} className="grid gap-3 rounded-xl border border-border bg-surface p-4">
              <div className="flex items-center gap-3"><Block className="size-10 rounded-xl" /><Block className="h-4 w-2/3" /></div>
              <Block className="h-3 w-full" /><Block className="h-3 w-4/5" /><Block className="h-2 w-full rounded-full" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
