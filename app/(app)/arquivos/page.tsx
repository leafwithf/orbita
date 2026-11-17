import type { Metadata } from "next";
import { FileText, FolderOpen, Image as ImageIcon, Info, Upload } from "lucide-react";

import { FileActions } from "@/components/files/file-actions";
import { FileUploader } from "@/components/files/file-uploader";

import { EmptyState } from "@/components/patterns/empty-state";
import { PageHeader } from "@/components/patterns/page-header";
import { SectionCard } from "@/components/patterns/section-card";
import { StatusChip } from "@/components/patterns/status-chip";
import { getAppContext } from "@/lib/data/context";
import { listFiles } from "@/lib/data/files";
import { formatDatePtBr } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { formatBytes, quotaState } from "@/modules/files/domain";

export const metadata: Metadata = { title: "Arquivos" };

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
  const quota = quotaState(usage.usedBytes, usage.limitBytes);
  const percent = quota.percent;

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
            description="Envie do computador ou do celular. O arquivo vai direto para o armazenamento e só aparece como pronto depois de conferido."
          >
            <div className="mb-4">
              <FileUploader workspaceId={context.workspace.id} />
            </div>
            {files.length === 0 ? (
              <EmptyState
                icon={FolderOpen}
                title="Nenhum arquivo enviado"
                description="Escolha um arquivo acima. O limite é de 25 MB por arquivo e 1 GB por espaço."
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
                      <FileActions
                        fileId={file.id}
                        fileName={file.fileName}
                        mime={file.mime}
                        ready={file.status === "ready"}
                      />
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
                className={cn(
                  "h-full rounded-full",
                  quota.level === "ok" ? "bg-brand" : quota.level === "warning" ? "bg-warning" : "bg-danger",
                )}
                style={{ width: `${percent}%` }}
              />
            </div>
            <p className="mt-2 text-[11.5px] leading-relaxed text-faint">
              {quota.level === "full"
                ? "Espaço cheio: exclua arquivos para enviar novos."
                : quota.level === "warning"
                  ? `Atenção: restam ${formatBytes(quota.remainingBytes)}.`
                  : `${percent}% usado`}{" "}
              · limite por arquivo de 25 MB.
            </p>
          </SectionCard>

        </aside>
      </div>
    </div>
  );
}
