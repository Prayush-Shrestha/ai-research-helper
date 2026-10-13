import { forwardRef, type InputHTMLAttributes } from "react";
import { cx } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, id, className, required, ...rest },
  ref
) {
  const inputId = id ?? `input-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  return (
    <div className="w-full">
      <label htmlFor={inputId} className="mb-1.5 block text-[17px]" style={{ color: "var(--color-apple-ink)" }}>
        {label}
        {required && (
          <span aria-hidden className="ml-1" style={{ color: "var(--color-alert)" }}>*</span>
        )}
      </label>
      <input
        ref={ref}
        id={inputId}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
        className={cx("field-input", className)}
        style={error ? { borderColor: "var(--color-alert)" } : undefined}
        {...rest}
      />
      {error ? (
        <p id={`${inputId}-error`} role="alert" className="mt-1.5 text-[15px]" style={{ color: "var(--color-alert)" }}>
          {error}
        </p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="mt-1.5 text-[15px]" style={{ color: "var(--color-slate)" }}>
          {hint}
        </p>
      ) : null}
    </div>
  );
});
