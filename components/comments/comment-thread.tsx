"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { FormMessage } from "@/components/auth/form-message";
import { FileMentionTextarea } from "@/components/files/file-mention-textarea";
import { SubmitButton } from "@/components/forms/submit-button";
import { UserAvatar } from "@/components/layout/user-avatar";
import { addCommentAction, deleteCommentAction, editCommentAction } from "@/lib/actions/collab";
import { initialFormState } from "@/lib/actions/state";
import type { CommentEntity, CommentItem } from "@/lib/data/comments";
import { formatDateTimePtBr } from "@/lib/dates";
import { MAX_COMMENT_LENGTH } from "@/modules/collab/domain";

export function CommentThread({
  workspaceId,
  entityType,
  entityId,
  comments,
  viewerId,
  canComment,
  canModerate,
  files: initialFiles = [],
}: {
  workspaceId: string;
  entityType: CommentEntity;
  entityId: string;
  comments: CommentItem[];
  viewerId: string;
  canComment: boolean;
  canModerate: boolean;
  files?: { id: string; fileName: string }[];
}) {
  const router = useRouter();
  const [files, setFiles] = useState(initialFiles);
  const [filesLoaded, setFilesLoaded] = useState(false);
  useEffect(() => {
    let active = true;
    fetch("/api/files/mentions?workspaceId=" + encodeURIComponent(workspaceId))
      .then((response) => response.ok ? response.json() : { files: [] })
      .then((data) => { if (active) { setFiles(data.files ?? []); setFilesLoaded(true); } })
      .catch(() => { if (active) { setFiles([]); setFilesLoaded(true); } });
    return () => { active = false; };
  }, [workspaceId]);
  const commentFormRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(
    async (previousState: typeof initialFormState, formData: FormData) => {
      const result = await addCommentAction(previousState, formData);
      if (result.status === "success") setNewBody("");
      return result;
    },
    initialFormState,
  );
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [newBody, setNewBody] = useState("");

  function renderBody(body: string) {
    const parts = body.split(/(\[\[arquivo:[0-9a-f-]{36}\]\])/gi);
    return parts.map((part, index) => {
      const match = /^\[\[arquivo:([0-9a-f-]{36})\]\]$/i.exec(part);
      if (!match) return <span key={index}>{part}</span>;
      const file = files.find((item) => item.id === match[1]);
      if (!file) return <span key={index} className="inline-flex items-center gap-1 rounded-md bg-foreground px-1.5 py-0.5 text-[12px] font-semibold text-background">{filesLoaded ? "📎 Arquivo indisponível" : "📎 Carregando arquivo…"}</span>;
      return (
        <a key={index} href={"/api/files/" + match[1] + "/url"} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-md bg-foreground px-1.5 py-0.5 font-semibold text-background underline underline-offset-2">
          <span aria-hidden="true">📎</span>{file.fileName}
        </a>
      );
    });
  }
  async function saveEdit(id: string) {
    const result = await editCommentAction({ commentId: id, body: draft });
    if (result.status === "error") {
      toast.error(result.message ?? "Não foi possível editar.");
      return;
    }
    setEditing(null);
    router.refresh();
  }

  async function remove(id: string) {
    const result = await deleteCommentAction(id);
    if (result.status === "error") {
      toast.error(result.message ?? "Não foi possível apagar.");
      return;
    }
    router.refresh();
  }

  return (
    <section aria-labelledby="comments-heading" className="grid gap-4">
      <h2 id="comments-heading" className="text-[15px] font-semibold">
        Comentários {comments.length > 0 ? `(${comments.length})` : ""}
      </h2>

      {comments.length === 0 ? (
        <p className="text-[13px] text-muted">Ainda não há comentários.</p>
      ) : (
        <ul className="grid gap-3">
          {comments.map((comment) => {
            const mine = comment.authorId === viewerId;
            return (
              <li key={comment.id} className="flex gap-3">
                <UserAvatar name={comment.authorName} size="lg" />
                <div className="min-w-0 flex-1 rounded-md border border-border bg-surface p-3 text-ink">
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <span className="text-[13px] font-semibold">{mine ? "Você" : comment.authorName}</span>
                    <time dateTime={comment.createdAt} className="text-[11.5px] text-faint">
                      {formatDateTimePtBr(comment.createdAt)}
                    </time>
                    {comment.edited ? <span className="text-[11.5px] text-faint">· editado</span> : null}
                  </div>

                  {editing === comment.id ? (
                    <div className="mt-2 grid gap-2">
                      <label htmlFor={`edit-${comment.id}`} className="sr-only">
                        Editar comentário
                      </label>
                      <FileMentionTextarea
                        id={`edit-${comment.id}`}
                        workspaceId={workspaceId}
                        value={draft}
                        onChange={setDraft}
                        maxLength={MAX_COMMENT_LENGTH}
                        rows={3}
                      />
                      <div className="flex gap-2">
                        <button type="button" onClick={() => saveEdit(comment.id)} className="min-h-11 rounded-md bg-brand px-3 text-[12.5px] font-semibold text-white hover:bg-brand-hover">
                          Salvar
                        </button>
                        <button type="button" onClick={() => setEditing(null)} className="min-h-11 rounded-md border border-border-strong px-3 text-[12.5px] font-semibold hover:bg-surface-2">
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-1 text-[14px] leading-relaxed whitespace-pre-wrap break-words text-ink">{renderBody(comment.body)}</p>
                  )}

                  {editing !== comment.id && (mine || canModerate) ? (
                    <div className="mt-2 flex gap-1">
                      {mine ? (
                        <button
                          type="button"
                          onClick={() => {
                            setEditing(comment.id);
                            setDraft(comment.body);
                          }}
                          aria-label="Editar comentário"
                          className="grid size-11 place-items-center rounded-md text-muted hover:bg-surface-2 hover:text-ink"
                        >
                          <Pencil className="size-4" aria-hidden="true" />
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => remove(comment.id)}
                        aria-label="Apagar comentário"
                        className="grid size-11 place-items-center rounded-md text-muted hover:bg-surface-2 hover:text-danger"
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                      </button>
                    </div>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {canComment ? (
        <form ref={commentFormRef} action={formAction} className="grid gap-2">
          <input type="hidden" name="workspaceId" value={workspaceId} />
          <input type="hidden" name="entityType" value={entityType} />
          <input type="hidden" name="entityId" value={entityId} />
          <label htmlFor="new-comment" className="text-[13px] font-medium">
            Novo comentário
          </label>
          <div className="relative">
            <FileMentionTextarea
              id="new-comment"
              name="body"
              workspaceId={workspaceId}
              value={newBody}
              onChange={setNewBody}
              rows={3}
              required
              maxLength={MAX_COMMENT_LENGTH}
              placeholder={files.length ? "Escreva ou digite @ para mencionar qualquer arquivo do espaço…" : "Escreva para quem acompanha este item…"}
              className="min-h-24"
            />
          </div>
          {state.status === "error" ? <FormMessage status="error" message={state.message} /> : null}
          <div>
            <SubmitButton pending={pending} pendingLabel="Enviando…">
              Comentar
            </SubmitButton>
          </div>
        </form>
      ) : (
        <p className="text-[12.5px] text-muted">Seu papel neste espaço não permite comentar.</p>
      )}
    </section>
  );
}
