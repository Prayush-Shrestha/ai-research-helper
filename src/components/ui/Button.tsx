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
  const sizeStyle: CSSProperties =
    size === "sm" ? { padding: "8px 18px", fontSize: 15 } : size === "lg" ? { padding: "14px 32px", fontSize: 17 } : { padding: "10px 24px", fontSize: 17 };
  const variantStyle: CSSProperties =
    variant === "primary"
      ? { background: "var(--color-electric-blue)", color: "#fff", border: "none", borderRadius: 980 }
      : variant === "secondary"
        ? { background: "transparent", border: "1px solid var(--color-apple-ink)", color: "var(--color-apple-ink)", borderRadius: 980 }
        : variant === "destructive"
          ? { background: "transparent", border: "1px solid var(--color-alert)", color: "var(--color-alert)", borderRadius: 980 }
          : { background: "transparent", border: "none", color: "var(--color-link-blue)", borderRadius: 0, paddingLeft: 4, paddingRight: 4 };

  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cx("inline-flex select-none items-center justify-center gap-2 font-normal", fullWidth && "w-full", className)}
      style={{
        ...variantStyle,
        ...sizeStyle,
        letterSpacing: "-0.019em",
        fontFamily: "var(--font-sf-pro-text)",
        opacity: disabled || loading ? 0.5 : 1,
        cursor: disabled || loading ? "not-allowed" : undefined,
        ...style,
      }}
      {...rest}
    >
      {loading && (
        <span aria-hidden className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  );
});
