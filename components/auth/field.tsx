import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type FieldProps = {
  id: string;
  name: string;
  label: string;
  type?: React.HTMLInputTypeAttribute;
  autoComplete?: string;
  placeholder?: string;
  defaultValue?: string;
  error?: string[];
  hint?: string;
  required?: boolean;
  autoFocus?: boolean;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  className?: string;
};

export function Field({
  id,
  name,
  label,
  type = "text",
  autoComplete,
  placeholder,
  defaultValue,
  error,
  hint,
  required = true,
  autoFocus,
  inputMode,
  className,
}: FieldProps) {
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy =
    [hint ? hintId : null, error?.length ? errorId : null]
      .filter(Boolean)
      .join(" ") || undefined;

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
        name={name}
        type={type}
        autoComplete={autoComplete}
        placeholder={placeholder}
        defaultValue={defaultValue}
        required={required}
        autoFocus={autoFocus}
        inputMode={inputMode}
        aria-invalid={error?.length ? true : undefined}
        aria-describedby={describedBy}
        className="h-11 bg-surface px-3 text-[15px] md:text-sm"
      />
      {hint ? (
        <p id={hintId} className="text-xs text-faint">
          {hint}
        </p>
      ) : null}
      {error?.length ? (
        <p id={errorId} className="text-[13px] font-medium text-danger">
          {error[0]}
        </p>
      ) : null}
    </div>
  );
}
