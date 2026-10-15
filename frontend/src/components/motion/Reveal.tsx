"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

/**
 * Scroll reveal — sections fade/slide/blur in once via IntersectionObserver.
 * No libraries. Respects prefers-reduced-motion via CSS.
 */
export function Reveal({
  children,
  delay = 0,
  className = "",
  as: Tag = "div",
  style,
  ...rest
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "section" | "span";
  style?: CSSProperties;
  id?: string;
  "aria-label"?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.classList.add("in");
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.disconnect();
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const merged: CSSProperties = {
    ["--reveal-delay" as string]: `${delay}ms`,
    ...style,
  };

  const restProps = rest as Record<string, unknown>;

  return (
    <Tag ref={ref as never} className={`reveal ${className}`} style={merged} {...restProps}>
      {children}
    </Tag>
  );
}
