import { InputHTMLAttributes, forwardRef } from "react";
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
      <label htmlFor={inputId} className="mb-1.5 block text-[13px] font-medium" style={{ color: "var(--color-secondary-text)" }}>
        {label}
        {required && (
          <span aria-hidden className="ml-0.5" style={{ color: "#ff9d9d" }}>
            *
          </span>
        )}
      </label>
      <input
        ref={ref}
        id={inputId}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
        className={cx(
          "h-10 w-full rounded-xl border px-3 text-sm placeholder:text-[#62686A]",
          "transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50",
          error
            ? "border-[#5A3535]"
            : "hover:border-[#34383B] focus:border-[#B7FFDF]",
          className
        )}
        style={{ background: "var(--color-graphite)", borderColor: error ? undefined : "var(--color-hairline)", color: "var(--color-primary-text)" }}
        {...rest}
      />
      {error ? (
        <p id={`${inputId}-error`} role="alert" className="mt-1.5 text-[13px]" style={{ color: "#ff9d9d" }}>
          {error}
        </p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="mt-1.5 text-[13px]" style={{ color: "var(--color-tertiary-text)" }}>
          {hint}
        </p>
      ) : null}
    </div>
  );
});
