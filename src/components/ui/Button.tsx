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
    "bg-[#E7E7E2] text-[#050505] hover:bg-white focus-visible:outline-[#B7FFDF] disabled:bg-[#2A2D2F] disabled:text-[#62686A]",
  secondary:
    "bg-[#202124] text-[#E7E7E2] border border-[#292B2D] hover:border-[#34383B] hover:bg-[#26282B] disabled:text-[#62686A]",
  ghost: "bg-transparent text-[#92989A] hover:bg-[#17191B] hover:text-[#E7E7E2] disabled:text-[#62686A]",
  destructive: "bg-transparent text-[#ff9d9d] border border-[#3A2A2A] hover:bg-[#2A1A1A] hover:border-[#5A3535] disabled:text-[#62686A]",
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
        "inline-flex select-none items-center justify-center gap-2 rounded-full font-medium transition-all duration-200",
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
