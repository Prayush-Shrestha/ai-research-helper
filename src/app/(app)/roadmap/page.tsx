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
    <div>
      <section className="pt-6 text-center sm:pt-10">
        <h1 className="type-heading mx-auto" style={{ color: "var(--color-apple-ink)" }}>
          Idea to admit.
        </h1>
        <p className="mx-auto mt-4 max-w-xl" style={{ fontSize: 21, color: "var(--color-graphite)" }}>
          Six stages from a blank page to a paper on your application.
          Tick tasks off — progress saves on this device.
        </p>
        <div className="mx-auto mt-6 flex max-w-md items-center gap-3">
          <div className="h-[8px] w-full overflow-hidden" style={{ background: "var(--color-ash)", borderRadius: 99 }}>
            <div style={{ width: `${pct}%`, height: "100%", background: "var(--color-electric-blue)", borderRadius: 99, transition: "width .4s ease" }} />
          </div>
          <p className="shrink-0" style={{ fontSize: 15, fontWeight: 600, color: "var(--color-apple-ink)" }}>{pct}%</p>
        </div>
      </section>

      <section className="mt-8 grid gap-5" aria-label="The six stages">
        {ROADMAP.map((stage, i) => {
          const doneCount = stage.tasks.filter((_, t) => checked.includes(`${stage.id}-${t}`)).length;
          const complete = doneCount === stage.tasks.length;
          return (
            <div key={stage.id} className="gallery-card">
              <div className="flex items-baseline gap-3">
                <span
                  aria-hidden
                  className="flex h-8 w-8 shrink-0 items-center justify-center"
                  style={{ borderRadius: 999, background: complete ? "var(--color-electric-blue)" : "var(--color-ash)", color: complete ? "#fff" : "var(--color-iron)", fontSize: 15, fontWeight: 600 }}
                >
                  {complete ? "✓" : i + 1}
                </span>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 600, color: "var(--color-slate)" }}>{stage.duration}</p>
                  <h2 style={{ fontSize: 21, fontWeight: 600, letterSpacing: "-0.012em", color: "var(--color-apple-ink)" }}>
                    {stage.title}
                  </h2>
                </div>
                <span className="ml-auto shrink-0" style={{ fontSize: 12, color: "var(--color-slate)" }}>{doneCount}/{stage.tasks.length}</span>
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
                        className="flex w-full items-start gap-3 px-3 py-2.5 text-left"
                        style={{ background: on ? "var(--color-fog-canvas)" : "transparent", borderRadius: 18 }}
                      >
                        <span
                          aria-hidden
                          className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center"
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            borderRadius: 999,
                            border: on ? "none" : "1.5px solid var(--color-line)",
                            background: on ? "var(--color-electric-blue)" : "transparent",
                            color: on ? "#fff" : "var(--color-slate)",
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
                  <Link key={l.href} href={l.href} style={{ fontSize: 17, color: "var(--color-link-blue)" }}>
                    {l.label} →
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </section>

      <section className="mt-8" aria-label="Abroad calendar">
        <h2 className="type-heading-sm text-center" style={{ color: "var(--color-apple-ink)" }}>Mapped to your year.</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {ABROAD_PHASES.map(([time, title, body]) => (
            <div key={time} className="gallery-card">
              <p style={{ fontSize: 12, fontWeight: 600, color: "var(--color-electric-blue)" }}>{time}</p>
              <p className="mt-1.5" style={{ fontSize: 19, fontWeight: 600, color: "var(--color-apple-ink)" }}>{title}</p>
              <p className="mt-1" style={{ fontSize: 15, color: "var(--color-graphite)", lineHeight: 1.55 }}>{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="gallery-card mb-4 mt-8 text-center">
        <p style={{ fontSize: 12, fontWeight: 600, color: "var(--color-slate)" }}>START TODAY</p>
        <p className="mx-auto mt-2" style={{ fontFamily: "var(--font-sf-pro-display)", fontSize: 32, fontWeight: 600, maxWidth: 560, lineHeight: 1.15, color: "var(--color-apple-ink)" }}>
          Upload one paper. That&rsquo;s stage two, begun.
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
