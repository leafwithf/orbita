import type { ComponentProps, ReactNode } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { FileMentionTextarea } from "@/components/files/file-mention-textarea";

type FieldChrome = {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
};

function describedBy(id: string, hint?: string, error?: string) {
  return (
    [hint ? `${id}-hint` : null, error ? `${id}-error` : null]
      .filter(Boolean)
      .join(" ") || undefined
  );
}

function FieldMessages({
  id,
  hint,
  error,
}: {
  id: string;
  hint?: string;
  error?: string;
}) {
  return (
    <>
      {hint ? (
        <p id={`${id}-hint`} className="text-xs leading-relaxed text-faint">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className="text-[12.5px] font-medium text-danger">
          {error}
        </p>
      ) : null}
    </>
  );
}

export function TextField({
  id,
  label,
  hint,
  error,
  required = true,
  className,
  ...props
}: FieldChrome & Omit<ComponentProps<typeof Input>, "id" | "className">) {
  return (
    <div className={cn("grid gap-1.5", className)}>
      <Label htmlFor={id} className="text-[13px] font-medium">
        {label}
        {!required ? (
          <span className="ml-1 font-normal text-faint">(opcional)</span>
        ) : null}
      </Label>
      <Input
        id={id}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        className="h-11 bg-surface px-3 text-[15px] md:text-sm"
        {...props}
      />
      <FieldMessages id={id} hint={hint} error={error} />
    </div>
  );
}

export function TextAreaField({
  id,
  label,
  workspaceId,
  hint,
  error,
  required = false,
  className,
  ...props
}: FieldChrome & Omit<ComponentProps<typeof Textarea>, "id" | "className"> & { workspaceId?: string }) {
  return (
    <div className={cn("grid gap-1.5", className)}>
      <Label htmlFor={id} className="text-[13px] font-medium">
        {label}
        {!required ? (
          <span className="ml-1 font-normal text-faint">(opcional)</span>
        ) : null}
      </Label>
      {workspaceId ? (
        <FileMentionTextarea
          id={id}
          name={props.name}
          workspaceId={workspaceId}
          defaultValue={typeof props.defaultValue === "string" ? props.defaultValue : ""}
          placeholder={props.placeholder}
          maxLength={props.maxLength}
          rows={props.rows}
          required={required}
          className="min-h-24 bg-surface"
        />
      ) : (
        <Textarea
          id={id}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, hint, error)}
          className="min-h-24 bg-surface px-3 py-2.5 text-[15px] md:text-sm"
          {...props}
        />
      )}
      <FieldMessages id={id} hint={hint} error={error} />
    </div>
  );
}

export function SelectField({
  id,
  label,
  hint,
  error,
  required = false,
  className,
  children,
  ...props
}: FieldChrome &
  Omit<ComponentProps<"select">, "id" | "className"> & {
    children: ReactNode;
  }) {
  return (
    <div className={cn("grid gap-1.5", className)}>
      <Label htmlFor={id} className="text-[13px] font-medium">
        {label}
        {!required ? (
          <span className="ml-1 font-normal text-faint">(opcional)</span>
        ) : null}
      </Label>
      <select
        id={id}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        className="h-11 w-full rounded-md border border-input bg-surface px-3 text-[15px] text-ink shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive md:text-sm dark:bg-input/30"
        {...props}
      >
        {children}
      </select>
      <FieldMessages id={id} hint={hint} error={error} />
    </div>
  );
}

export function CheckboxField({
  id,
  label,
  description,
  className,
  ...props
}: Omit<ComponentProps<"input">, "type" | "id" | "className"> & {
  id: string;
  label: string;
  description?: ReactNode;
  className?: string;
}) {
  return (
    <label
      htmlFor={id}
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-md border border-border bg-surface-2 px-3.5 py-3 transition-colors hover:border-border-strong",
        className,
      )}
    >
      <input
        id={id}
        type="checkbox"
        className="mt-0.5 size-5 flex-none rounded border-border-strong accent-[var(--brand)] outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        {...props}
      />
      <span className="min-w-0">
        <span className="block text-[13px] font-semibold text-ink">
          {label}
        </span>
        {description ? (
          <span className="mt-0.5 block text-[12px] leading-relaxed text-muted">
            {description}
          </span>
        ) : null}
      </span>
    </label>
  );
}
