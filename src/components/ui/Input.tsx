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
      <label htmlFor={inputId} className="mb-1.5 block text-[13px] font-medium text-[#0F172A]">
        {label}
        {required && (
          <span aria-hidden className="ml-0.5 text-[#DC2626]">
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
          "h-10 w-full rounded-lg border bg-white px-3 text-sm text-[#0F172A] placeholder:text-[#94A3B8]",
          "transition-colors disabled:cursor-not-allowed disabled:bg-[#F8FAFC] disabled:text-[#94A3B8]",
          error
            ? "border-[#DC2626] focus:border-[#DC2626]"
            : "border-[#E2E8F0] hover:border-[#CBD5E1] focus:border-[#4F46E5]",
          className
        )}
        {...rest}
      />
      {error ? (
        <p id={`${inputId}-error`} role="alert" className="mt-1.5 text-[13px] text-[#DC2626]">
          {error}
        </p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="mt-1.5 text-[13px] text-[#64748B]">
          {hint}
        </p>
      ) : null}
    </div>
  );
});
