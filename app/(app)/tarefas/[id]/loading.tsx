import { Skeleton } from "@/components/ui/skeleton";

function Block({ className = "" }: { className?: string }) {
  return <Skeleton className={`orbital-skeleton ${className}`} />;
}

export default function TaskDetailLoading() {
  return (
    <div aria-label="Carregando tarefa" aria-busy="true" className="grid min-w-0 gap-6">
      <Block className="h-4 w-36" />
      <header className="grid gap-3"><Block className="h-3 w-28" /><Block className="h-9 w-80 max-w-full" /><Block className="h-4 w-64 max-w-full" /></header>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(280px,1fr)]">
        <section className="grid content-start gap-4 rounded-xl border border-border bg-surface p-4"><Block className="h-5 w-28" />{[0, 1, 2].map((item) => <div key={item} className="flex gap-3 border-t border-border pt-3"><Block className="size-8 rounded-full" /><div className="grid flex-1 gap-2"><Block className="h-3.5 w-3/5" /><Block className="h-3 w-4/5" /></div></div>)}<Block className="h-20 w-full rounded-lg" /></section>
        <aside className="grid content-start gap-5"><section className="grid gap-3 rounded-xl border border-border bg-surface p-4"><Block className="h-5 w-24" /><div className="flex gap-2"><Block className="h-6 w-20 rounded-full" /><Block className="h-6 w-20 rounded-full" /></div><Block className="h-10 w-full rounded-md" /></section></aside>
      </div>
    </div>
  );
}
