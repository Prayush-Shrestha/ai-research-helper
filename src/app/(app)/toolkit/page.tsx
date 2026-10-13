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
      className="shrink-0 rounded-full px-4 py-1.5"
      style={{
        fontSize: 15,
        border: "1px solid var(--color-line)",
        background: done ? "var(--color-apple-ink)" : "transparent",
        color: done ? "#fff" : "var(--color-link-blue)",
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

  return (
    <div className="gallery-card grid gap-8 lg:grid-cols-[1fr_1.2fr]">
      <div>
        <p style={{ fontSize: 12, fontWeight: 600, color: "var(--color-slate)" }}>DETAILS</p>
        <div className="mt-3 space-y-4">
          <div>
            <label htmlFor="cite-authors" className="mb-1.5 block text-[17px]" style={{ color: "var(--color-apple-ink)" }}>
              Authors <span style={{ fontSize: 15, color: "var(--color-slate)" }}>— separate with commas</span>
            </label>
            <input
              id="cite-authors" value={form.authors} onChange={(e) => updateField("authors", e.target.value)}
              placeholder="Ada Lovelace, Alan Turing"
              className="field-input"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="cite-year" className="mb-1.5 block text-[17px]" style={{ color: "var(--color-apple-ink)" }}>Year</label>
              <input
                id="cite-year" value={form.year} onChange={(e) => updateField("year", e.target.value)}
                placeholder="2026" inputMode="numeric"
                className="field-input"
              />
            </div>
            <div>
              <label htmlFor="cite-kind" className="mb-1.5 block text-[17px]" style={{ color: "var(--color-apple-ink)" }}>Type</label>
              <select
                id="cite-kind" value={form.kind} onChange={(e) => updateField("kind", e.target.value as CiteInput["kind"])}
                className="field-input"
                style={{ background: "var(--color-pure-white)" }}
              >
                <option value="Conference">Conference</option>
                <option value="Journal">Journal</option>
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="cite-title" className="mb-1.5 block text-[17px]" style={{ color: "var(--color-apple-ink)" }}>Paper title</label>
            <input
              id="cite-title" value={form.title} onChange={(e) => updateField("title", e.target.value)}
              placeholder="Attention Is All You Need"
              className="field-input"
            />
          </div>
          <div>
            <label htmlFor="cite-venue" className="mb-1.5 block text-[17px]" style={{ color: "var(--color-apple-ink)" }}>Venue</label>
            <input
              id="cite-venue" value={form.venue} onChange={(e) => updateField("venue", e.target.value)}
              placeholder="Advances in Neural Information Processing Systems"
              className="field-input"
            />
          </div>
        </div>
      </div>
      <div>
        <p style={{ fontSize: 12, fontWeight: 600, color: "var(--color-slate)" }}>RESULT — LIVE</p>
        <div className="mt-3 space-y-3">
          {(
            [
              ["APA", apa],
              ["IEEE", ieee],
              ["BIBTEX", bib],
            ] as Array<[string, string]>
          ).map(([label, text]) => (
            <div key={label} style={{ background: "var(--color-fog-canvas)", borderRadius: 18, padding: "14px 18px" }}>
              <div className="flex items-center justify-between gap-3">
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--color-slate)" }}>{label}</span>
                {ready && <CopyButton text={text} />}
              </div>
              <p className="mt-1.5 text-[15px]" style={{ color: ready ? "var(--color-apple-ink)" : "var(--color-slate)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
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
          <div className="mt-3 h-[8px] w-full max-w-md overflow-hidden" style={{ background: "var(--color-ash)", borderRadius: 99 }}>
            <div style={{ width: `${pct}%`, height: "100%", background: "var(--color-electric-blue)", borderRadius: 99, transition: "width .4s ease" }} />
          </div>
        </div>
        <p className="shrink-0" style={{ fontSize: 15, color: "var(--color-graphite)" }}>
          {pct === 100 ? "Ready to submit ✓" : pct >= 50 ? "Draft taking shape" : "Start with title + abstract"}
        </p>
      </div>

      <div className="gallery-card mt-4 !p-4 sm:!p-5">
        {STRUCTURE.map((s) => {
          const done = checked.includes(s.id);
          return (
            <div key={s.id} className="py-4" style={{ borderBottom: "1px solid var(--color-line)" }}>
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
                    fontWeight: 600,
                    borderRadius: 999,
                    border: done ? "none" : "1.5px solid var(--color-line)",
                    background: done ? "var(--color-electric-blue)" : "transparent",
                    color: done ? "#fff" : "var(--color-slate)",
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
    <div>
      <section className="pt-6 text-center sm:pt-10">
        <h1 className="type-heading mx-auto" style={{ color: "var(--color-apple-ink)" }}>
          Write it right.
        </h1>
        <p className="mx-auto mt-4 max-w-xl" style={{ fontSize: 21, color: "var(--color-graphite)" }}>
          Sloppy citations and missing sections sink first papers.
          Fix both below — free, in your browser.
        </p>
      </section>

      <section className="mt-10" aria-label="Citation builder">
        <h2 className="type-heading-sm" style={{ color: "var(--color-apple-ink)" }}>1 · Citation builder.</h2>
        <p className="mt-2 max-w-xl" style={{ fontSize: 17, color: "var(--color-graphite)" }}>
          Type the details once — get APA, IEEE and BibTeX instantly.
        </p>
        <div className="mt-5"><CitationBuilder /></div>
      </section>

      <section className="mt-12" aria-label="Structure checklist">
        <h2 className="type-heading-sm" style={{ color: "var(--color-apple-ink)" }}>2 · Paper checklist.</h2>
        <p className="mt-2 max-w-xl" style={{ fontSize: 17, color: "var(--color-graphite)" }}>
          Tick sections off as you write. Progress saves on this device.
        </p>
        <div className="mt-5"><StructureChecklist /></div>
      </section>

      <section className="gallery-card mb-4 mt-8 text-center">
        <p style={{ fontSize: 12, fontWeight: 600, color: "var(--color-slate)" }}>DRAFT TAKING SHAPE?</p>
        <p className="mt-2" style={{ fontFamily: "var(--font-sf-pro-display)", fontSize: 32, fontWeight: 600, color: "var(--color-apple-ink)" }}>
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
