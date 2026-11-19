"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { FormMessage } from "@/components/auth/form-message";
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
}: {
  workspaceId: string;
  entityType: CommentEntity;
  entityId: string;
  comments: CommentItem[];
  viewerId: string;
  canComment: boolean;
  canModerate: boolean;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(addCommentAction, initialFormState);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  // Troca a chave após enviar para limpar o campo sem controlar cada tecla.
  const [formKey, setFormKey] = useState(0);

  useEffect(() => {
    if (state.status === "success") setFormKey((value) => value + 1);
  }, [state]);

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
                <div className="min-w-0 flex-1 rounded-md border border-border bg-surface p-3">
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
                      <textarea
                        id={`edit-${comment.id}`}
                        value={draft}
                        onChange={(event) => setDraft(event.target.value)}
                        maxLength={MAX_COMMENT_LENGTH}
                        rows={3}
                        className="rounded-md border border-border-strong bg-surface p-2 text-[14px]"
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
                    <p className="mt-1 text-[14px] leading-relaxed whitespace-pre-wrap break-words">{comment.body}</p>
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
        <form key={formKey} action={formAction} className="grid gap-2">
          <input type="hidden" name="workspaceId" value={workspaceId} />
          <input type="hidden" name="entityType" value={entityType} />
          <input type="hidden" name="entityId" value={entityId} />
          <label htmlFor="new-comment" className="text-[13px] font-medium">
            Novo comentário
          </label>
          <textarea
            id="new-comment"
            name="body"
            rows={3}
            required
            maxLength={MAX_COMMENT_LENGTH}
            aria-invalid={state.fieldErrors?.body ? true : undefined}
            className="rounded-md border border-border-strong bg-surface p-3 text-[14px]"
            placeholder="Escreva para quem acompanha este item…"
          />
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
