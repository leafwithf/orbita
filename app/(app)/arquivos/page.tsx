import type { Metadata } from "next";
import Link from "next/link";
import { FileText, FolderOpen, Image as ImageIcon, Info, Upload } from "lucide-react";

import { EmptyState } from "@/components/patterns/empty-state";
import { PageHeader } from "@/components/patterns/page-header";
import { SectionCard } from "@/components/patterns/section-card";
import { StatusChip } from "@/components/patterns/status-chip";
import { getAppContext } from "@/lib/data/context";
import { listFiles } from "@/lib/data/files";
import { formatDatePtBr } from "@/lib/dates";

export const metadata: Metadata = { title: "Arquivos" };

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export default async function FilesPage() {
  const context = await getAppContext();

  if (!context.workspace) {
    return (
      <PageHeader
        title="Arquivos"
        description="Seu espaço ainda não está disponível. Rode as migrações do Supabase para começar."
      />
    );
  }

  const { files, usage } = await listFiles(context.workspace.id);
  const percent = Math.min(
    100,
    Math.round((usage.usedBytes / usage.limitBytes) * 100),
  );

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow={`${files.length} ${files.length === 1 ? "arquivo" : "arquivos"}`}
        title="Arquivos"
        description="Briefings, referências e entregas ficam no mesmo espaço do projeto. Tipos são validados no servidor."
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(290px,1fr)]">
        <div className="grid min-w-0 content-start gap-5">
          <SectionCard
            title="Biblioteca do espaço"
            description="Enviar arquivos será liberado assim que o storage estiver conectado neste ambiente."
          >
            {files.length === 0 ? (
              <EmptyState
                icon={FolderOpen}
                title="Nenhum arquivo enviado"
                description="Quando o envio estiver ativo, você poderá anexar arquivos de até 25 MB direto do celular. O limite do espaço é de 1 GB."
                compact
              />
            ) : (
              <ul className="divide-y divide-border">
                {files.map((file) => {
                  const Icon = file.mime.startsWith("image/")
                    ? ImageIcon
                    : FileText;
                  return (
                    <li
                      key={file.id}
                      className="flex items-start gap-3 py-3 first:pt-0 last:pb-0"
                    >
                      <span className="grid size-9 flex-none place-items-center rounded-md bg-surface-2 text-muted">
                        <Icon className="size-4" aria-hidden="true" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-medium">
                          {file.fileName}
                        </p>
                        <p className="mt-0.5 text-[11.5px] text-faint">
                          {formatBytes(file.sizeBytes)} ·{" "}
                          {formatDatePtBr(file.createdAt.slice(0, 10))}
                          {file.context ? ` · ${file.context}` : ""}
                        </p>
                      </div>
                      <StatusChip
                        label={
                          file.status === "ready"
                            ? "Pronto"
                            : file.status === "pending"
                              ? "Enviando"
                              : file.status === "quarantined"
                                ? "Em análise"
                                : "Removido"
                        }
                        tone={file.status === "ready" ? "success" : "warning"}
                      />
                    </li>
                  );
                })}
              </ul>
            )}
          </SectionCard>

          <SectionCard title="Como os arquivos funcionam">
            <ul className="grid gap-3 text-[13px] leading-relaxed text-muted">
              <li className="flex gap-2.5">
                <Upload className="mt-0.5 size-4 flex-none text-brand" aria-hidden="true" />
                O envio é direto para o storage, com URL assinada e curta duração.
                O arquivo não passa pelo servidor da aplicação.
              </li>
              <li className="flex gap-2.5">
                <Info className="mt-0.5 size-4 flex-none text-brand" aria-hidden="true" />
                O tipo real do arquivo é conferido, não apenas a extensão. Um
                arquivo disfarçado é recusado.
              </li>
              <li className="flex gap-2.5">
                <FileText className="mt-0.5 size-4 flex-none text-brand" aria-hidden="true" />
                Excluir move para a lixeira por 30 dias. Você pode restaurar
                antes da limpeza definitiva.
              </li>
            </ul>
          </SectionCard>
        </div>

        <aside className="grid min-w-0 content-start gap-5">
          <SectionCard title="Cota do espaço">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-[22px] leading-none font-semibold tabular-nums">
                {formatBytes(usage.usedBytes)}
              </span>
              <span className="text-[12px] text-faint">
                de {formatBytes(usage.limitBytes)}
              </span>
            </div>
            <div
              role="progressbar"
              aria-label="Uso do armazenamento do espaço"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={percent}
              className="mt-3 h-2 overflow-hidden rounded-full bg-border"
            >
              <div
                className="h-full rounded-full bg-brand"
                style={{ width: `${percent}%` }}
              />
            </div>
            <p className="mt-2 text-[11.5px] leading-relaxed text-faint">
              {percent}% usado · limite por arquivo de 25 MB.
            </p>
            <p className="mt-3 rounded-md border border-border bg-surface-2 px-3 py-2 text-[11.5px] leading-relaxed text-muted">
              O envio ainda não está ativo nesta base. A cota e as validações já
              estão preparadas no banco.
            </p>
          </SectionCard>

          <SectionCard title="Precisa de um arquivo agora?">
            <p className="text-[12.5px] leading-relaxed text-muted">
              Enquanto o upload não está disponível, use as notas do projeto para
              registrar links e referências externas.
            </p>
            <Link
              href="/projetos"
              className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-md border border-border-strong bg-surface px-3 text-[12.5px] font-semibold text-ink no-underline hover:bg-surface-2 hover:no-underline"
            >
              Abrir projetos
            </Link>
          </SectionCard>
        </aside>
      </div>
    </div>
  );
}
