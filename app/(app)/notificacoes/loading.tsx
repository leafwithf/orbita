import { Skeleton } from "@/components/ui/skeleton";

function Block({ className = "" }: { className?: string }) {
  return <Skeleton className={`orbital-skeleton ${className}`} />;
}

export default function NotificationsLoading() {
  return (
    <div aria-label="Carregando notificações" aria-busy="true" className="grid min-w-0 gap-6">
      <header className="grid gap-2">
        <Block className="h-8 w-44" />
        <Block className="h-4 w-72 max-w-full" />
      </header>
      {[0, 1].map((section) => (
        <section key={section} className="overflow-hidden rounded-xl border border-border bg-surface">
          <div className="grid gap-2 border-b border-border p-4">
            <Block className="h-4 w-36" />
            <Block className="h-3 w-64 max-w-full" />
          </div>
          <div className="divide-y divide-border">
            {[0, 1, 2].map((item) => (
              <div key={item} className="flex items-start gap-3 p-4">
                <Block className="mt-1 size-2 rounded-full" />
                <div className="grid min-w-0 flex-1 gap-2">
                  <Block className="h-3.5 w-4/5 max-w-full" />
                  <Block className="h-3 w-28" />
                  <Block className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
