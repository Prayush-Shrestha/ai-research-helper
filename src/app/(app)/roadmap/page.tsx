"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { SectionDivider } from "@/components/editorial/TechnicalLabel";
import { ABROAD_PHASES, ROADMAP, loadChecked, saveChecked } from "@/lib/student";

const STORE_KEY = "lemma_roadmap_tasks";

export default function RoadmapPage() {
  const [checked, setChecked] = useState<string[]>(() => loadChecked(STORE_KEY));

  const total = useMemo(() => ROADMAP.reduce((n, s) => n + s.tasks.length, 0), []);
  const pct = Math.round((checked.length / total) * 100);

  function toggle(id: string) {
    setChecked((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      saveChecked(STORE_KEY, next);
      return next;
    });
  }

  return (
    <main className="mx-auto px-5 sm:px-8" style={{ maxWidth: "var(--page-width)" }}>
      <section className="pt-12 sm:pt-16">
        <p className="font-tech" style={{ color: "var(--color-tertiary-text)" }}>ROADMAP / 09 — FOR STUDENTS</p>
        <h1
          className="font-display mt-2"
          style={{ fontSize: "clamp(48px,7vw,84px)", lineHeight: 0.95, letterSpacing: "-2px" }}
        >
          Idea
          <br />
          to admit.
        </h1>
        <p className="mt-4 max-w-lg text-[15px]" style={{ color: "var(--color-secondary-text)", lineHeight: 1.7 }}>
          Six stages from a blank page to a paper on your SOP. Tick tasks off as you go —
          progress is saved on this device.
        </p>
        <div className="mt-6 flex items-center gap-4">
          <div className="h-[5px] w-full max-w-md overflow-hidden rounded-full" style={{ background: "var(--color-control)" }}>
            <div style={{ width: `${pct}%`, height: "100%", background: "var(--color-research-accent)", borderRadius: 99, transition: "width .4s ease" }} />
          </div>
          <p className="font-tech shrink-0" style={{ color: "var(--color-secondary-text)" }}>{pct}% DONE</p>
        </div>
      </section>

      <div className="mt-10"><SectionDivider label="THE SIX STAGES" /></div>
      <section className="mt-2" style={{ borderTop: "1px solid var(--color-hairline)" }}>
        {ROADMAP.map((stage, i) => {
          const doneCount = stage.tasks.filter((_, t) => checked.includes(`${stage.id}-${t}`)).length;
          const complete = doneCount === stage.tasks.length;
          return (
            <div key={stage.id} className="grid gap-4 py-8 sm:grid-cols-[56px_1fr] sm:items-start" style={{ borderBottom: "1px solid var(--color-hairline)" }}>
              <span className="font-tech" style={{ color: complete ? "var(--color-research-accent)" : "var(--color-tertiary-text)" }}>
                {complete ? "✓" : String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <p className="font-tech" style={{ color: "var(--color-tertiary-text)", fontSize: 10 }}>{stage.duration}</p>
                <h2 className="mt-1 text-[22px] font-medium tracking-tight" style={{ color: "var(--color-primary-text)" }}>
                  {stage.title}
                </h2>
                <p className="mt-1 max-w-xl text-[14px]" style={{ color: "var(--color-secondary-text)", lineHeight: 1.7 }}>{stage.body}</p>
                <ul className="mt-4 space-y-2">
                  {stage.tasks.map((task, t) => {
                    const id = `${stage.id}-${t}`;
                    const on = checked.includes(id);
                    return (
                      <li key={id}>
                        <button
                          type="button"
                          onClick={() => toggle(id)}
                          aria-pressed={on}
                          className="flex w-full max-w-xl items-start gap-3 rounded-xl px-3 py-2.5 text-left"
                          style={{
                            border: "1px solid var(--color-hairline)",
                            background: on ? "rgba(183,255,223,0.04)" : "transparent",
                          }}
                        >
                          <span
                            aria-hidden
                            className="font-tech mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                            style={{
                              fontSize: 10,
                              border: "1px solid var(--color-hairline)",
                              background: on ? "var(--color-research-accent)" : "transparent",
                              color: on ? "#050505" : "var(--color-tertiary-text)",
                            }}
                          >
                            {on ? "✓" : ""}
                          </span>
                          <span
                            className="text-[14px]"
                            style={{ color: on ? "var(--color-tertiary-text)" : "var(--color-primary-text)", textDecoration: on ? "line-through" : undefined, lineHeight: 1.6 }}
                          >
                            {task}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
                <div className="mt-3 flex flex-wrap gap-3">
                  {stage.links.map((l) => (
                    <Link key={l.href} href={l.href} className="font-tech" style={{ color: "var(--color-research-accent)", fontSize: 10 }}>
                      {l.label.toUpperCase()}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </section>

      <div className="mt-10"><SectionDivider label="MAPPED TO YOUR ABROAD CALENDAR" /></div>
      <section className="grid gap-px overflow-hidden sm:grid-cols-2 lg:grid-cols-4" style={{ border: "1px solid var(--color-hairline)", borderRadius: "var(--radius-panel)", background: "var(--color-hairline)" }}>
        {ABROAD_PHASES.map(([time, title, body]) => (
          <div key={time} className="px-6 py-6" style={{ background: "var(--color-deep-black)" }}>
            <p className="font-tech" style={{ color: "var(--color-research-accent)", fontSize: 10 }}>{time}</p>
            <p className="mt-2 text-[15px] font-medium" style={{ color: "var(--color-primary-text)" }}>{title}</p>
            <p className="mt-1 text-[13px]" style={{ color: "var(--color-secondary-text)", lineHeight: 1.7 }}>{body}</p>
          </div>
        ))}
      </section>

      <section
        className="mb-4 mt-10 px-6 py-8 text-center sm:px-12"
        style={{ border: "1px solid var(--color-hairline)", borderRadius: "var(--radius-panel)", background: "var(--color-deep-black)" }}
      >
        <p className="font-tech" style={{ color: "var(--color-tertiary-text)", fontSize: 10 }}>START TODAY, NOT “SOMEDAY”</p>
        <p className="font-display mx-auto mt-2" style={{ fontSize: "clamp(26px,4vw,40px)", maxWidth: 560, lineHeight: 1.1 }}>
          Upload one paper. That&apos;s stage two, begun.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <Link href="/documents" className="font-tech rounded-full px-7 py-3" style={{ background: "var(--color-primary-text)", color: "#050505", fontSize: 11 }}>
            OPEN MY LIBRARY →
          </Link>
          <Link href="/publish" className="font-tech px-4 py-3" style={{ color: "var(--color-secondary-text)", fontSize: 11 }}>
            browse venues
          </Link>
        </div>
      </section>
    </main>
  );
}
