import { ButtonHTMLAttributes, forwardRef } from "react";
import { cx } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "destructive";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
}

const variants: Record<Variant, string> = {
  primary:
    "bg-[#4F46E5] text-white hover:bg-[#4338CA] focus-visible:outline-[#4F46E5] disabled:bg-[#C7D2FE] disabled:text-white",
  secondary:
    "bg-white text-[#0F172A] border border-[#E2E8F0] hover:border-[#CBD5E1] hover:bg-[#F8FAFC] disabled:text-[#94A3B8]",
  ghost: "bg-transparent text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A] disabled:text-[#CBD5E1]",
  destructive: "bg-[#DC2626] text-white hover:bg-[#B91C1C] disabled:bg-[#FECACA]",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-[13px]",
  md: "h-10 px-4 text-sm",
  lg: "h-11 px-5 text-[15px]",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", loading = false, fullWidth = false, className, children, disabled, ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cx(
        "inline-flex select-none items-center justify-center gap-2 rounded-lg font-medium transition-colors duration-150",
        "disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        fullWidth && "w-full",
        className
      )}
      {...rest}
    >
      {loading && (
        <span
          aria-hidden
          className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      )}
      {children}
    </button>
  );
});
