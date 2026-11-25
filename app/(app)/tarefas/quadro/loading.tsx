import { Skeleton } from "@/components/ui/skeleton";

function Block({ className = "" }: { className?: string }) {
  return <Skeleton className={`orbital-skeleton ${className}`} />;
}

export default function KanbanLoading() {
  return (
    <div aria-label="Carregando quadro de tarefas" aria-busy="true" className="grid min-w-0 gap-6">
      <section className="orbita-panel grid gap-5 rounded-3xl border border-border bg-surface p-6 sm:p-8">
        <div className="grid gap-3"><Block className="h-3 w-32" /><Block className="h-9 w-72 max-w-full" /><Block className="h-4 w-80 max-w-full" /></div>
        <div className="grid grid-cols-3 gap-3 border-t border-border pt-5 sm:max-w-xl">{[0, 1, 2].map((item) => <div key={item} className="flex items-center gap-2"><Block className="size-8 rounded-lg" /><div className="grid gap-2"><Block className="h-5 w-8" /><Block className="h-3 w-16" /></div></div>)}</div>
      </section>
      <div className="grid min-w-0 gap-3 md:grid-cols-3">
        {[0, 1, 2].map((column) => <section key={column} className="grid min-w-0 content-start gap-3 rounded-xl border border-border bg-surface-2 p-3"><Block className="h-5 w-28" />{[0, 1, 2].map((item) => <div key={item} className="orbita-panel grid gap-3 rounded-lg border border-border bg-surface p-4"><Block className="h-3.5 w-4/5" /><Block className="h-3 w-2/5" /><div className="flex gap-2"><Block className="h-6 w-16 rounded-full" /><Block className="h-6 w-16 rounded-full" /></div></div>)}</section>)}
      </div>
    </div>
  );
}
