"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { SectionDivider } from "@/components/editorial/TechnicalLabel";
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
        void navigator.clipboard?.writeText(text).then(
          () => {
            setDone(true);
            window.setTimeout(() => setDone(false), 1600);
          },
          () => setDone(false)
        );
      }}
      className="font-tech shrink-0 rounded-full px-4 py-1.5"
      style={{
        fontSize: 10,
        border: "1px solid var(--color-hairline)",
        background: "var(--color-control)",
        color: done ? "var(--color-research-accent)" : "var(--color-secondary-text)",
      }}
    >
      {done ? "COPIED ✓" : "COPY"}
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

  const field: React.CSSProperties = {
    borderBottom: "1px solid #292B2D",
    color: "var(--color-primary-text)",
    borderRadius: 0,
  };

  function set<K extends keyof CiteInput>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  return (
    <div
      className="grid gap-0 overflow-hidden"
      style={{ border: "1px solid var(--color-hairline)", borderRadius: "var(--radius-panel)", background: "var(--color-deep-black)" }}
    >
      <div className="grid gap-8 p-6 sm:p-10 lg:grid-cols-[1fr_1.2fr]">
        <div>
          <p className="micro-label" style={{ color: "var(--color-tertiary-text)" }}>INPUT</p>
          <div className="mt-4 space-y-5">
            <div>
              <label htmlFor="cite-authors" className="micro-label block" style={{ color: "var(--color-tertiary-text)" }}>
                AUTHORS — SEPARATE WITH COMMAS
              </label>
              <input
                id="cite-authors" value={form.authors} onChange={(e) => set("authors", e.target.value)}
                placeholder="Ada Lovelace, Alan Turing"
                className="mt-2 w-full bg-transparent px-0 py-2.5 text-[15px] outline-none" style={field}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="cite-year" className="micro-label block" style={{ color: "var(--color-tertiary-text)" }}>YEAR</label>
                <input
                  id="cite-year" value={form.year} onChange={(e) => set("year", e.target.value)}
                  placeholder="2026" inputMode="numeric"
                  className="mt-2 w-full bg-transparent px-0 py-2.5 text-[15px] outline-none" style={field}
                />
              </div>
              <div>
                <label htmlFor="cite-kind" className="micro-label block" style={{ color: "var(--color-tertiary-text)" }}>TYPE</label>
                <select
                  id="cite-kind" value={form.kind} onChange={(e) => set("kind", e.target.value as CiteInput["kind"])}
                  className="mt-2 w-full bg-transparent px-0 py-2.5 text-[15px] outline-none"
                  style={{ ...field, background: "var(--color-deep-black)" }}
                >
                  <option value="Conference">Conference</option>
                  <option value="Journal">Journal</option>
                </select>
              </div>
            </div>
            <div>
              <label htmlFor="cite-title" className="micro-label block" style={{ color: "var(--color-tertiary-text)" }}>PAPER TITLE</label>
              <input
                id="cite-title" value={form.title} onChange={(e) => set("title", e.target.value)}
                placeholder="Attention Is All You Need"
                className="mt-2 w-full bg-transparent px-0 py-2.5 text-[15px] outline-none" style={field}
              />
            </div>
            <div>
              <label htmlFor="cite-venue" className="micro-label block" style={{ color: "var(--color-tertiary-text)" }}>VENUE</label>
              <input
                id="cite-venue" value={form.venue} onChange={(e) => set("venue", e.target.value)}
                placeholder="Advances in Neural Information Processing Systems"
                className="mt-2 w-full bg-transparent px-0 py-2.5 text-[15px] outline-none" style={field}
              />
            </div>
          </div>
        </div>
        <div>
          <p className="micro-label" style={{ color: "var(--color-tertiary-text)" }}>OUTPUT — LIVE</p>
          <div className="mt-4 space-y-4">
            {(
              [
                ["APA", apa],
                ["IEEE", ieee],
                ["BIBTEX", bib],
              ] as Array<[string, string]>
            ).map(([label, text]) => (
              <div key={label} style={{ border: "1px solid var(--color-hairline)", borderRadius: 12, background: "var(--color-graphite)" }}>
                <div className="flex items-center justify-between px-4 pt-3">
                  <span className="font-tech" style={{ color: "var(--color-research-accent)", fontSize: 10 }}>{label}</span>
                  {ready && <CopyButton text={text} />}
                </div>
                <p className="px-4 pb-4 pt-2 text-[13px]" style={{ color: ready ? "var(--color-primary-text)" : "var(--color-tertiary-text)", lineHeight: 1.7, whiteSpace: "pre-wrap", fontFamily: label === "BIBTEX" ? "var(--font-mono)" : undefined }}>
                  {ready ? text : "Fill in authors, title and venue to generate…"}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StructureChecklist() {
  const [checked, setChecked] = useState<string[]>(() => loadChecked(STORE_KEY));

  function toggle(id: string) {
    setChecked((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      saveChecked(STORE_KEY, next);
      return next;
    });
  }

  const pct = Math.round((checked.length / STRUCTURE.length) * 100);

  return (
    <div>
      <div
        className="flex flex-col gap-3 px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-10"
        style={{ border: "1px solid var(--color-hairline)", borderRadius: "var(--radius-panel)", background: "var(--color-deep-black)" }}
      >
        <div>
          <p className="font-tech" style={{ color: "var(--color-secondary-text)" }}>
            PAPER READINESS — {checked.length}/{STRUCTURE.length} SECTIONS · {pct}%
          </p>
          <div className="mt-3 h-[5px] w-full max-w-md overflow-hidden rounded-full sm:w-96" style={{ background: "var(--color-control)" }}>
            <div style={{ width: `${pct}%`, height: "100%", background: "var(--color-research-accent)", borderRadius: 99, transition: "width .4s ease" }} />
          </div>
        </div>
        <p className="font-tech" style={{ color: "var(--color-tertiary-text)", fontSize: 10 }}>
          {pct === 100 ? "READY TO SUBMIT ✓" : pct >= 50 ? "DRAFT TAKING SHAPE" : "START WITH TITLE + ABSTRACT"}
        </p>
      </div>

      <div className="mt-4" style={{ borderTop: "1px solid var(--color-hairline)" }}>
        {STRUCTURE.map((s, i) => {
          const done = checked.includes(s.id);
          return (
            <div key={s.id} className="grid gap-3 py-6 sm:grid-cols-[56px_1fr] sm:items-start" style={{ borderBottom: "1px solid var(--color-hairline)" }}>
              <span className="font-tech" style={{ color: "var(--color-tertiary-text)" }}>{String(i + 1).padStart(2, "0")}</span>
              <div>
                <button
                  type="button"
                  onClick={() => toggle(s.id)}
                  aria-pressed={done}
                  className="flex w-full items-center justify-between gap-4 text-left"
                >
                  <span className="text-[17px] font-medium tracking-tight" style={{ color: done ? "var(--color-tertiary-text)" : "var(--color-primary-text)", textDecoration: done ? "line-through" : undefined }}>
                    {s.title}
                  </span>
                  <span
                    aria-hidden
                    className="font-tech flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                    style={{
                      fontSize: 11,
                      border: "1px solid var(--color-hairline)",
                      background: done ? "var(--color-research-accent)" : "transparent",
                      color: done ? "#050505" : "var(--color-tertiary-text)",
                    }}
                  >
                    {done ? "✓" : ""}
                  </span>
                </button>
                <p className="mt-1 text-[14px]" style={{ color: "var(--color-secondary-text)" }}>{s.what}</p>
                <ul className="mt-2 space-y-1">
                  {s.tips.map((t) => (
                    <li key={t} className="text-[13px]" style={{ color: "var(--color-tertiary-text)", lineHeight: 1.7 }}>
                      — {t}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function ToolkitPage() {
  return (
    <main className="mx-auto px-5 sm:px-8" style={{ maxWidth: "var(--page-width)" }}>
      <section className="pt-12 sm:pt-16">
        <p className="font-tech" style={{ color: "var(--color-tertiary-text)" }}>TOOLKIT / 08 — FOR STUDENTS</p>
        <h1
          className="font-display mt-2"
          style={{ fontSize: "clamp(48px,7vw,84px)", lineHeight: 0.95, letterSpacing: "-2px" }}
        >
          Write it
          <br />
          right.
        </h1>
        <p className="mt-4 max-w-lg text-[15px]" style={{ color: "var(--color-secondary-text)", lineHeight: 1.7 }}>
          The two things that sink first papers: sloppy citations and missing sections.
          Both are fixed below — free, in your browser, no backend needed.
        </p>
      </section>

      <div className="mt-10"><SectionDivider label="01 — CITATION BUILDER" /></div>
      <p className="mt-4 max-w-xl text-[14px]" style={{ color: "var(--color-secondary-text)", lineHeight: 1.7 }}>
        Type the details once, get APA, IEEE and BibTeX instantly. Never hand-format a reference again.
      </p>
      <div className="mt-6"><CitationBuilder /></div>

      <div className="mt-12"><SectionDivider label="02 — PAPER STRUCTURE CHECKLIST" /></div>
      <p className="mt-4 max-w-xl text-[14px]" style={{ color: "var(--color-secondary-text)", lineHeight: 1.7 }}>
        Tick sections off as you write them. Your progress is saved on this device — come back anytime.
      </p>
      <div className="mt-6"><StructureChecklist /></div>

      <section
        className="mb-4 mt-10 px-6 py-8 sm:px-10"
        style={{ border: "1px solid var(--color-hairline)", borderRadius: "var(--radius-panel)", background: "var(--color-deep-black)" }}
      >
        <p className="font-tech" style={{ color: "var(--color-tertiary-text)", fontSize: 10 }}>DRAFT TAKING SHAPE?</p>
        <p className="font-display mt-2" style={{ fontSize: "clamp(26px,4vw,40px)", lineHeight: 1.1 }}>
          Now give it a deadline.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link href="/publish" className="font-tech rounded-full px-7 py-3" style={{ background: "var(--color-primary-text)", color: "#050505", fontSize: 11 }}>
            FIND A VENUE →
          </Link>
          <Link href="/roadmap" className="font-tech rounded-full px-7 py-3" style={{ border: "1px solid var(--color-hairline)", color: "var(--color-secondary-text)", fontSize: 11 }}>
            FULL ROADMAP
          </Link>
        </div>
      </section>
    </main>
  );
}
