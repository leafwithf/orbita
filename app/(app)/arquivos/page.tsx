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
import { canEditContent } from "@/modules/workspaces/domain";
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

  const workspace = context.workspace;
  const { files, usage } = await listFiles(workspace.id);
  const quota = quotaState(usage.usedBytes, usage.limitBytes);
  const percent = quota.percent;

  return (
    <div className="grid gap-7">
      <section className="relative isolate overflow-hidden rounded-[28px] border border-brand/25 bg-[radial-gradient(ellipse_at_top_right,color-mix(in_srgb,var(--brand)_22%,transparent),transparent_55%),linear-gradient(145deg,var(--surface),var(--surface-2))] p-5 shadow-[var(--shadow-2)] sm:p-8">
        <div className="relative z-10">
      <PageHeader
        eyebrow={`${files.length} ${files.length === 1 ? "arquivo" : "arquivos"}`}
        title="Arquivos"
        description="Biblioteca central do espaço: envie cada arquivo uma vez e mencione em qualquer projeto, tarefa ou conversa usando @."
      />
        </div>
        <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-16 size-48 rounded-full border border-brand/20 bg-brand/5 blur-2xl" />
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(290px,1fr)]">
        <div className="grid min-w-0 content-start gap-6">
          <SectionCard
            title="Biblioteca do espaço"
            description="Envie do computador ou do celular. O arquivo vai direto para o armazenamento e só aparece como pronto depois de conferido."
          >
            <div className="mb-4">
              {canEditContent(workspace.role) ? <FileUploader workspaceId={workspace.id} /> : <p className="text-[12px] text-muted">Seu papel neste espaço permite consultar e baixar arquivos, mas não enviar novos materiais.</p>}
            </div>
            {files.length === 0 ? (
              <EmptyState
                icon={FolderOpen}
                title="Nenhum arquivo enviado"
                description="Escolha um arquivo acima. O limite é de 25 MB por arquivo e 1 GB por espaço."
                compact
              />
            ) : (
              <ul className="grid gap-3">
                {files.map((file) => {
                  const Icon = file.mime.startsWith("image/")
                    ? ImageIcon
                    : FileText;
                  return (
                    <li
                      key={file.id}
                      className="orbita-panel flex min-w-0 flex-col gap-3 rounded-2xl border border-border bg-surface/85 p-3 shadow-[var(--shadow-1)] transition-colors hover:border-brand/30 sm:flex-row sm:items-center sm:p-4"
                    >
                      <span className="grid size-11 flex-none place-items-center rounded-xl border border-brand/15 bg-brand/10 text-brand">
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
                      <div className="flex w-full flex-wrap items-center justify-between gap-2 sm:w-auto sm:justify-end">
                      <FileActions
                        fileId={file.id}
                        fileName={file.fileName}
                        mime={file.mime}
                        ready={file.status === "ready"}
                        canManage={canEditContent(workspace.role)}
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
                    </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </SectionCard>

          <SectionCard title="Como funciona a biblioteca" description="Informações importantes sobre segurança e armazenamento.">
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

        <aside className="grid min-w-0 content-start gap-4">
          <SectionCard title="Cota do espaço">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-3xl leading-none font-bold tracking-tight tabular-nums">
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
              className="mt-4 h-3 overflow-hidden rounded-full bg-border/80"
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
