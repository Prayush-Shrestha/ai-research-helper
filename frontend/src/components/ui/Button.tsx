import { forwardRef, type ButtonHTMLAttributes, type CSSProperties } from "react";
import { cx } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "destructive";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", loading = false, fullWidth = false, className, children, disabled, style, ...rest },
  ref
) {
  if (variant === "primary") {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cx("primary-button", fullWidth && "w-full", className)}
        style={{ opacity: disabled || loading ? 0.55 : 1, ...style }}
        {...rest}
      >
        {loading && <span aria-hidden className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />}
        {children}
      </button>
    );
  }
  if (variant === "ghost") {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cx("ghost-pill", fullWidth && "w-full", className)}
        style={{ opacity: disabled || loading ? 0.55 : 1, ...style }}
        {...rest}
      >
        {loading && <span aria-hidden className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />}
        {children}
      </button>
    );
  }
  const sizeStyle: CSSProperties =
    size === "sm" ? { padding: "8px 18px", fontSize: 14 } : size === "lg" ? { padding: "14px 32px", fontSize: 16 } : { padding: "10px 24px", fontSize: 15 };
  const variantStyle: CSSProperties =
    variant === "secondary"
      ? { background: "rgba(255,255,255,0.05)", border: "1px solid var(--liquid-border)", color: "var(--color-apple-ink)", borderRadius: 999, backdropFilter: "blur(12px)" }
      : { background: "rgba(255,155,138,0.08)", border: "1px solid rgba(255,155,138,0.35)", color: "var(--color-alert)", borderRadius: 999 };

  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cx("inline-flex select-none items-center justify-center gap-2 font-medium", fullWidth && "w-full", className)}
      style={{ ...variantStyle, ...sizeStyle, letterSpacing: "-0.01em", opacity: disabled || loading ? 0.5 : 1, ...style }}
      {...rest}
    >
      {loading && <span aria-hidden className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />}
      {children}
    </button>
  );
});
