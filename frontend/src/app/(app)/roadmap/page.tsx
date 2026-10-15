"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ABROAD_PHASES, ROADMAP, loadChecked, saveChecked } from "@/lib/student";

const STORE_KEY = "lemma_roadmap_tasks";

export default function RoadmapPage() {
  // Load after mount to avoid SSR/client hydration mismatch (localStorage is client-only).
  const [checked, setChecked] = useState<string[]>([]);
  useEffect(() => {
    void (async () => {
      await Promise.resolve();
      setChecked(loadChecked(STORE_KEY));
    })();
  }, []);

  const total = useMemo(() => ROADMAP.reduce((n, s) => n + s.tasks.length, 0), []);
  const pct = total === 0 ? 0 : Math.round((checked.length / total) * 100);

  function toggle(id: string) {
    setChecked((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      // Defer persistence: updaters must stay pure (StrictMode double-invokes).
      queueMicrotask(() => saveChecked(STORE_KEY, next));
      return next;
    });
  }

  return (
    <div className="page-shell page-enter">
      <section className="relative overflow-hidden pt-6 text-center sm:pt-10">
        <span aria-hidden className="orb rise rise-1" style={{ width: 420, height: 420, left: "-8%", top: "-140px", background: "radial-gradient(circle, rgba(255,255,255,0.16), transparent 65%)" }} />
        <span aria-hidden className="orb rise rise-2" style={{ width: 480, height: 480, right: "-10%", top: "-100px", background: "radial-gradient(circle, rgba(255,255,255,0.13), transparent 65%)" }} />
        <div className="relative" style={{ zIndex: 1 }}>
          <p className="eyebrow rise rise-1"><span className="dot" aria-hidden /> Roadmap · Idea to admit</p>
          <h1 className="type-heading rise rise-2 mx-auto mt-4" style={{ color: "var(--color-apple-ink)", fontWeight: 600, letterSpacing: "-0.03em" }}>
            Idea to admit.
          </h1>
          <p className="hero-sub rise rise-3 mx-auto mt-4 max-w-xl">
            Six small stages from a blank page to a paper you can list on an application.
            Tick tasks off as you go; progress saves on this device.
          </p>
          <div className="rise rise-4 mt-6 flex flex-wrap justify-center gap-3">
            <a href="#stages" className="primary-button">Start stage one</a>
            <Link href="/publish" className="ghost-pill">Browse venues</Link>
          </div>
          <div className="mx-auto mt-6 flex max-w-md items-center gap-3" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Roadmap progress">
            <div className="h-[8px] w-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)", borderRadius: 99, border: "1px solid var(--liquid-border-soft)" }}>
              <div style={{ width: `${pct}%`, height: "100%", background: "var(--color-electric-blue)", borderRadius: 99, transition: "width .4s ease", boxShadow: "var(--liquid-glow-mint)" }} />
            </div>
            <p className="shrink-0" style={{ fontSize: 15, fontWeight: 600, color: "var(--color-apple-ink)" }}>{pct}%</p>
          </div>
        </div>
      </section>

      <section id="stages" className="mt-8 grid scroll-mt-24 gap-5" aria-label="The six stages">
        {ROADMAP.map((stage, i) => {
          const doneCount = stage.tasks.filter((_, t) => checked.includes(`${stage.id}-${t}`)).length;
          const complete = doneCount === stage.tasks.length;
          return (
            <div key={stage.id} className={`gallery-card rise rise-${(i % 6) + 1}`}>
              <div className="flex items-baseline gap-3">
                <span
                  aria-hidden
                  className="flex h-8 w-8 shrink-0 items-center justify-center"
                  style={complete
                    ? { borderRadius: 999, background: "var(--color-electric-blue)", color: "#06110C", fontSize: 15, fontWeight: 700, boxShadow: "var(--liquid-glow-mint), inset 0 1px 0 rgba(255,255,255,0.5)" }
                    : { borderRadius: 999, background: "rgba(255,255,255,0.07)", border: "1px solid var(--liquid-border)", color: "var(--color-graphite)", fontSize: 15, fontWeight: 600 }}
                >
                  {complete ? "✓" : i + 1}
                </span>
                <div>
                  <p className="tech-label" style={{ color: "var(--color-electric-blue)" }}>{stage.duration}</p>
                  <h2 style={{ fontSize: 21, fontWeight: 600, letterSpacing: "-0.012em", color: "var(--color-apple-ink)" }}>
                    {stage.title}
                  </h2>
                </div>
                <span className="tag-pill ml-auto shrink-0">{doneCount}/{stage.tasks.length}</span>
              </div>
              <p className="mt-2" style={{ fontSize: 17, color: "var(--color-iron)" }}>{stage.body}</p>
              <ul className="mt-3 space-y-1.5">
                {stage.tasks.map((task, t) => {
                  const id = `${stage.id}-${t}`;
                  const on = checked.includes(id);
                  return (
                    <li key={id}>
                      <button
                        type="button"
                        onClick={() => toggle(id)}
                        aria-pressed={on}
                        className="liquid-search flex w-full items-start gap-3 px-3 py-2.5 text-left"
                        style={{ borderRadius: 18, ...(on ? { background: "rgba(255,255,255,0.07)" } : undefined) }}
                      >
                        <span
                          aria-hidden
                          className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center"
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            borderRadius: 999,
                            border: on ? "1px solid rgba(255,255,255,0.5)" : "1.5px solid var(--liquid-border)",
                            background: on ? "rgba(255,255,255,0.16)" : "transparent",
                            color: on ? "var(--color-electric-blue)" : "var(--color-slate)",
                            boxShadow: on ? "var(--liquid-glow-mint)" : undefined,
                          }}
                        >
                          {on ? "✓" : ""}
                        </span>
                        <span
                          style={{ fontSize: 17, color: on ? "var(--color-slate)" : "var(--color-apple-ink)", textDecoration: on ? "line-through" : undefined, lineHeight: 1.5 }}
                        >
                          {task}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              <div className="mt-2 flex flex-wrap gap-4">
                {stage.links.map((l) => (
                  <Link key={l.href} href={l.href} className="secondary-button" style={{ fontSize: 17 }}>
                    {l.label} →
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </section>

      <section className="rise rise-3 mt-8" aria-label="Abroad calendar">
        <h2 className="type-heading-sm text-center" style={{ color: "var(--color-apple-ink)", fontWeight: 600, letterSpacing: "-0.03em" }}>Mapped to your year.</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {ABROAD_PHASES.map(([time, title, body], i) => (
            <div key={time} className={`glass-stat rise rise-${(i % 6) + 1}`}>
              <p className="tech-label" style={{ color: "var(--color-electric-blue)" }}>{time}</p>
              <p className="mt-1.5" style={{ fontSize: 19, fontWeight: 600, color: "var(--color-apple-ink)" }}>{title}</p>
              <p className="mt-1" style={{ fontSize: 15, color: "var(--color-graphite)", lineHeight: 1.55 }}>{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="gallery-card rise rise-5 mb-4 mt-8 text-center">
        <p className="eyebrow"><span className="dot" aria-hidden /> Start today</p>
        <p className="mx-auto mt-3" style={{ fontFamily: "var(--font-sf-pro-display)", fontSize: 32, fontWeight: 600, letterSpacing: "-0.03em", maxWidth: 560, lineHeight: 1.15, color: "var(--color-apple-ink)" }}>
          Upload one paper and you&rsquo;ve started stage two.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Link href="/documents" className="primary-button">
            Open my library
          </Link>
          <Link href="/publish" className="ghost-pill">
            Browse venues
          </Link>
        </div>
      </section>
    </div>
  );
}
