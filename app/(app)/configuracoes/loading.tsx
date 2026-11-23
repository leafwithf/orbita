import { Skeleton } from "@/components/ui/skeleton";

function Block({ className = "" }: { className?: string }) {
  return <Skeleton className={`orbital-skeleton ${className}`} />;
}

export default function SettingsLoading() {
  return (
    <div aria-label="Carregando configurações" aria-busy="true" className="grid min-w-0 gap-6">
      <header className="grid gap-3">
        <Block className="h-3 w-24" />
        <Block className="h-8 w-52" />
        <Block className="h-4 w-80 max-w-full" />
      </header>
      <div className="flex gap-2 overflow-hidden border-b border-border pb-2">
        {[0, 1, 2, 3].map((item) => <Block key={item} className="h-10 w-24 shrink-0 rounded-lg" />)}
      </div>
      <section className="grid gap-5 rounded-xl border border-border bg-surface p-4 sm:p-6">
        <div className="grid gap-2"><Block className="h-5 w-32" /><Block className="h-3 w-64 max-w-full" /></div>
        {[0, 1, 2].map((item) => (
          <div key={item} className="grid gap-2 border-t border-border pt-4">
            <Block className="h-3 w-28" />
            <Block className="h-11 w-full rounded-md" />
          </div>
        ))}
        <Block className="h-11 w-32 rounded-md" />
      </section>
    </div>
  );
}
