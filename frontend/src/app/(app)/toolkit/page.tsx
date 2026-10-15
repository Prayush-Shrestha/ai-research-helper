"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  STRUCTURE,
  citeAPA,
  citeBibTeX,
  citeIEEE,
  loadChecked,
  saveChecked,
  type CiteInput,
} from "@/lib/student";

const STORE_KEY = "lemma_toolkit_structure";

function CopyButton({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  if (!text) return null;
  return (
    <button
      type="button"
      onClick={() => {
        try {
          const clipboard = navigator?.clipboard;
          if (!clipboard?.writeText) {
            setDone(false);
            return;
          }
          void clipboard.writeText(text).then(
            () => {
              setDone(true);
              window.setTimeout(() => setDone(false), 1600);
            },
            () => setDone(false)
          );
        } catch {
          setDone(false);
        }
      }}
      className="ghost-pill shrink-0"
      aria-live="polite"
      style={{
        fontSize: 13,
        padding: "6px 16px",
        ...(done
          ? { background: "rgba(255,255,255,0.16)", color: "var(--color-electric-blue)", borderColor: "rgba(255,255,255,0.45)" }
          : undefined),
      }}
    >
      {done ? "Copied ✓" : "Copy"}
    </button>
  );
}

function CitationBuilder() {
  const [form, setForm] = useState<CiteInput>({
    authors: "",
    year: "2026",
    title: "",
    venue: "",
    kind: "Conference",
  });

  const apa = useMemo(() => citeAPA(form), [form]);
  const ieee = useMemo(() => citeIEEE(form), [form]);
  const bib = useMemo(() => citeBibTeX(form), [form]);
  const ready = form.authors.trim() && form.title.trim() && form.venue.trim();

  function updateField<K extends keyof CiteInput>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  const labelStyle = { fontSize: 15, fontWeight: 500, color: "var(--color-apple-ink)" } as const;

  return (
    <div className="gallery-card grid gap-8 lg:grid-cols-[1fr_1.2fr]">
      <div>
        <p className="tech-label" style={{ color: "var(--color-electric-blue)" }}>Details</p>
        <div className="mt-3 space-y-4">
          <div>
            <label htmlFor="cite-authors" className="mb-1.5 block" style={labelStyle}>
              Authors <span style={{ fontSize: 13, color: "var(--color-slate)" }}>(separate with commas)</span>
            </label>
            <input
              id="cite-authors" value={form.authors} onChange={(e) => updateField("authors", e.target.value)}
              placeholder="Ada Lovelace, Alan Turing"
              className="field-input"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="cite-year" className="mb-1.5 block" style={labelStyle}>Year</label>
              <input
                id="cite-year" value={form.year} onChange={(e) => updateField("year", e.target.value)}
                placeholder="2026" inputMode="numeric"
                className="field-input"
              />
            </div>
            <div>
              <label htmlFor="cite-kind" className="mb-1.5 block" style={labelStyle}>Type</label>
              <select
                id="cite-kind" value={form.kind} onChange={(e) => updateField("kind", e.target.value as CiteInput["kind"])}
                className="field-input"
              >
                <option value="Conference">Conference</option>
                <option value="Journal">Journal</option>
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="cite-title" className="mb-1.5 block" style={labelStyle}>Paper title</label>
            <input
              id="cite-title" value={form.title} onChange={(e) => updateField("title", e.target.value)}
              placeholder="Attention Is All You Need"
              className="field-input"
            />
          </div>
          <div>
            <label htmlFor="cite-venue" className="mb-1.5 block" style={labelStyle}>Venue</label>
            <input
              id="cite-venue" value={form.venue} onChange={(e) => updateField("venue", e.target.value)}
              placeholder="Advances in Neural Information Processing Systems"
              className="field-input"
            />
          </div>
        </div>
      </div>
      <div>
        <p className="tech-label" style={{ color: "var(--color-electric-blue)" }}>Live result</p>
        <div className="mt-3 space-y-3">
          {(
            [
              ["APA", apa],
              ["IEEE", ieee],
              ["BibTeX", bib],
            ] as Array<[string, string]>
          ).map(([label, text]) => (
            <div key={label} className="liquid-search" style={{ borderRadius: 18, padding: "14px 18px" }}>
              <div className="flex items-center justify-between gap-3">
                <span className="tag-pill">{label}</span>
                {ready && <CopyButton text={text} />}
              </div>
              <p className="mt-1.5 font-mono text-[15px]" style={{ color: ready ? "var(--color-apple-ink)" : "var(--color-slate)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                {ready ? text : "Fill in authors, title and venue to generate…"}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StructureChecklist() {
  // Load after mount to avoid SSR/client hydration mismatch (localStorage is client-only).
  const [checked, setChecked] = useState<string[]>([]);
  useEffect(() => {
    void (async () => {
      await Promise.resolve();
      setChecked(loadChecked(STORE_KEY));
    })();
  }, []);

  function toggle(id: string) {
    setChecked((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      // Defer persistence: updaters must stay pure (StrictMode double-invokes).
      queueMicrotask(() => saveChecked(STORE_KEY, next));
      return next;
    });
  }

  const pct = Math.round((checked.length / STRUCTURE.length) * 100);

  return (
    <div>
      <div className="gallery-card flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <p style={{ fontSize: 17, fontWeight: 600, color: "var(--color-apple-ink)" }}>
            {checked.length} of {STRUCTURE.length} sections · {pct}%
          </p>
          <div className="mt-3 h-[8px] w-full max-w-md overflow-hidden" style={{ background: "rgba(255,255,255,0.08)", borderRadius: 99, border: "1px solid var(--liquid-border-soft)" }}>
            <div style={{ width: `${pct}%`, height: "100%", background: "var(--color-electric-blue)", borderRadius: 99, transition: "width .4s ease", boxShadow: "var(--liquid-glow-mint)" }} />
          </div>
        </div>
        <p className="tag-pill crimson shrink-0" aria-live="polite">
          {pct === 100 ? "Ready to submit ✓" : pct >= 50 ? "Draft taking shape" : "Start with title + abstract"}
        </p>
      </div>

      <div className="gallery-card mt-4 !p-4 sm:!p-5">
        {STRUCTURE.map((s, i) => {
          const done = checked.includes(s.id);
          return (
            <div key={s.id} className="py-4" style={i === STRUCTURE.length - 1 ? undefined : { borderBottom: "1px solid var(--liquid-border-soft)" }}>
              <button
                type="button"
                onClick={() => toggle(s.id)}
                aria-pressed={done}
                className="flex w-full items-center justify-between gap-4 text-left"
              >
                <span style={{ fontSize: 19, fontWeight: 600, letterSpacing: "-0.015em", color: done ? "var(--color-slate)" : "var(--color-apple-ink)", textDecoration: done ? "line-through" : undefined }}>
                  {s.title}
                </span>
                <span
                  aria-hidden
                  className="flex h-7 w-7 shrink-0 items-center justify-center"
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    borderRadius: 999,
                    border: done ? "1px solid rgba(255,255,255,0.5)" : "1.5px solid var(--liquid-border)",
                    background: done ? "rgba(255,255,255,0.16)" : "transparent",
                    color: done ? "var(--color-electric-blue)" : "var(--color-slate)",
                    boxShadow: done ? "var(--liquid-glow-mint)" : undefined,
                  }}
                >
                  {done ? "✓" : ""}
                </span>
              </button>
              <p className="mt-1" style={{ fontSize: 17, color: "var(--color-iron)" }}>{s.what}</p>
              <ul className="mt-1.5 space-y-1">
                {s.tips.map((t) => (
                  <li key={t} style={{ fontSize: 15, color: "var(--color-slate)", lineHeight: 1.55 }}>
                    · {t}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function ToolkitPage() {
  return (
    <div className="page-shell page-enter">
      <section className="relative overflow-hidden pt-6 text-center sm:pt-10">
        <span aria-hidden className="orb rise rise-1" style={{ width: 420, height: 420, left: "-8%", top: "-140px", background: "radial-gradient(circle, rgba(255,255,255,0.16), transparent 65%)" }} />
        <span aria-hidden className="orb rise rise-2" style={{ width: 480, height: 480, right: "-10%", top: "-100px", background: "radial-gradient(circle, rgba(255,255,255,0.12), transparent 65%)" }} />
        <div className="relative" style={{ zIndex: 1 }}>
          <p className="eyebrow rise rise-1"><span className="dot" aria-hidden /> Toolkit · Write it right</p>
          <h1 className="type-heading rise rise-2 mx-auto mt-4" style={{ color: "var(--color-apple-ink)", fontWeight: 600, letterSpacing: "-0.03em" }}>
            Write it right.
          </h1>
          <p className="hero-sub rise rise-3 mx-auto mt-4 max-w-xl">
            Citations and structure get easier with practice.
            Both tools below run free in your browser.
          </p>
          <div className="rise rise-4 mt-6 flex flex-wrap justify-center gap-3">
            <a href="#citation-builder" className="primary-button">Build a citation</a>
            <a href="#paper-checklist" className="ghost-pill">Open checklist</a>
          </div>
        </div>
      </section>

      <section id="citation-builder" className="rise rise-2 mt-10 scroll-mt-24" aria-label="Citation builder">
        <h2 className="type-heading-sm" style={{ color: "var(--color-apple-ink)", fontWeight: 600, letterSpacing: "-0.03em" }}>1 · Citation builder.</h2>
        <p className="hero-sub mt-2 max-w-xl">
          Type the details once and get APA, IEEE and BibTeX back right away.
        </p>
        <div className="mt-5"><CitationBuilder /></div>
      </section>

      <section id="paper-checklist" className="rise rise-3 mt-12 scroll-mt-24" aria-label="Structure checklist">
        <h2 className="type-heading-sm" style={{ color: "var(--color-apple-ink)", fontWeight: 600, letterSpacing: "-0.03em" }}>2 · Paper checklist.</h2>
        <p className="hero-sub mt-2 max-w-xl">
          Tick sections off as you write. Progress saves on this device.
        </p>
        <div className="mt-5"><StructureChecklist /></div>
      </section>

      <section className="gallery-card rise rise-5 mb-4 mt-8 text-center">
        <p className="eyebrow"><span className="dot" aria-hidden /> Draft taking shape?</p>
        <p className="mt-3" style={{ fontFamily: "var(--font-sf-pro-display)", fontSize: 32, fontWeight: 600, letterSpacing: "-0.03em", color: "var(--color-apple-ink)" }}>
          Now give it a deadline.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Link href="/publish" className="primary-button">
            Find a venue
          </Link>
          <Link href="/roadmap" className="ghost-pill">
            Full roadmap
          </Link>
        </div>
      </section>
    </div>
  );
}
