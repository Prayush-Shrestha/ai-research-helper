"use client";

import { useEffect, useRef } from "react";

/**
 * Cursor spotlight — a soft light that follows the mouse inside its parent.
 * Place inside a `relative` container. Disabled on touch / reduced motion.
 */
export function Spotlight({ size = 560, opacity = 0.12 }: { size?: number; opacity?: number }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const host = el.parentElement;
    if (!host) return;
    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      window.matchMedia("(hover: none)").matches
    ) {
      return;
    }
    let x = -9999;
    let y = -9999;
    let tx = x;
    let ty = y;
    let raf = 0;
    let inside = false;
    const onMove = (e: MouseEvent) => {
      const r = host.getBoundingClientRect();
      tx = e.clientX - r.left;
      ty = e.clientY - r.top;
      inside = true;
    };
    const onLeave = () => {
      inside = false;
    };
    const tick = () => {
      x += (tx - x) * 0.075;
      y += (ty - y) * 0.075;
      const o = inside ? opacity : 0;
      const cur = parseFloat(el.dataset.o ?? String(opacity));
      const next = cur + (o - cur) * 0.08;
      el.dataset.o = String(next);
      el.style.transform = `translate(${x - size / 2}px, ${y - size / 2}px)`;
      el.style.opacity = String(Math.max(0, next));
      raf = requestAnimationFrame(tick);
    };
    host.addEventListener("mousemove", onMove);
    host.addEventListener("mouseleave", onLeave);
    raf = requestAnimationFrame(tick);
    return () => {
      host.removeEventListener("mousemove", onMove);
      host.removeEventListener("mouseleave", onLeave);
      cancelAnimationFrame(raf);
    };
  }, [size, opacity]);

  return (
    <div
      aria-hidden
      ref={ref}
      className="spotlight"
      data-o={String(opacity)}
      style={{ width: size, height: size, opacity: 0 }}
    />
  );
}
