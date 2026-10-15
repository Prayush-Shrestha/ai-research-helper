"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { VENUES, daysUntil, formatDeadline, type Venue } from "@/lib/student";

type Filter = "ALL" | "Conference" | "Journal";
type Sort = "deadline" | "acceptance";

function Countdown({ v }: { v: Venue }) {
  if (!v.deadline) {
    return (
      <span className="tag-pill">
        Rolling · apply anytime
      </span>
    );
  }
  const days = daysUntil(v.deadline);
  const urgent = days <= 45 && days >= 0;
  return (
    <span
      className={urgent ? "tag-pill crimson" : "tag-pill"}
      style={urgent ? { background: "rgba(255,155,138,0.12)", borderColor: "rgba(255,155,138,0.4)", color: "var(--color-alert)" } : undefined}
    >
      {days < 0 ? "Passed · see next edition" : days === 0 ? "Due today" : `${days} days left · ${formatDeadline(v.deadline)}`}
    </span>
  );
}

export default function PublishPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("ALL");
  const [sort, setSort] = useState<Sort>("deadline");

  const list = useMemo(() => {
    const q = search.trim().toLowerCase();
    let out = [...VENUES];
    if (filter !== "ALL") out = out.filter((v) => v.type === filter);
    if (q) {
      out = out.filter(
        (v) =>
          v.name.toLowerCase().includes(q) ||
          v.field.toLowerCase().includes(q) ||
          v.location.toLowerCase().includes(q)
      );
    }
    out.sort((a, b) => {
      if (sort === "acceptance") return b.acceptancePct - a.acceptancePct;
      if (!a.deadline) return 1;
      if (!b.deadline) return -1;
      return +new Date(a.deadline) - +new Date(b.deadline);
    });
    return out;
  }, [search, filter, sort]);

  return (
    <div className="page-shell page-enter">
      <section className="relative overflow-hidden pt-6 text-center sm:pt-10">
        <span aria-hidden className="orb rise rise-1" style={{ width: 420, height: 420, left: "-8%", top: "-140px", background: "radial-gradient(circle, rgba(157,231,193,0.16), transparent 65%)" }} />
        <span aria-hidden className="orb rise rise-2" style={{ width: 480, height: 480, right: "-10%", top: "-100px", background: "radial-gradient(circle, rgba(138,180,248,0.13), transparent 65%)" }} />
        <div className="relative" style={{ zIndex: 1 }}>
          <p className="eyebrow rise rise-1"><span className="dot" aria-hidden /> Publish · Student venues</p>
          <h1 className="type-heading rise rise-2 mx-auto mt-4" style={{ color: "var(--color-apple-ink)", fontWeight: 600, letterSpacing: "-0.03em" }}>
            Get published.
          </h1>
          <p className="hero-sub rise rise-3 mx-auto mt-4 max-w-xl">
            Having one paper out makes an application read differently. The venues
            below are friendly to students and first-time authors.
          </p>
          <div className="rise rise-4 mt-6 flex flex-wrap justify-center gap-3">
            <a href="#venues" className="primary-button">Browse venues</a>
            <Link href="/roadmap" className="ghost-pill">Work backwards</Link>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-8 grid gap-5 sm:grid-cols-3" style={{ maxWidth: 1024 }} aria-label="Why publish">
        {[
          ["Proof, not promises", "A paper says you can finish research. Grades say you can pass exams."],
          ["Short counts", "Workshops and 2–4 page tracks accept student work. No full paper needed."],
          ["Rolling has no gate", "Rolling-review journals let you submit the month your draft is ready."],
        ].map(([k, v], i) => (
          <div key={k} className={`glass-stat rise rise-${i + 1}`}>
            <p style={{ fontSize: 19, fontWeight: 600, letterSpacing: "-0.015em", color: "var(--color-apple-ink)" }}>{k}</p>
            <p className="mt-1.5" style={{ fontSize: 17, color: "var(--color-graphite)" }}>{v}</p>
          </div>
        ))}
      </section>

      <section aria-label="Find a venue" className="rise rise-3 mx-auto mt-8" style={{ maxWidth: 680 }}>
        <div className="liquid-search flex items-center gap-3 px-5 py-3">
          <span aria-hidden style={{ color: "var(--color-slate)", fontSize: 17 }}>⌕</span>
          <label htmlFor="venue-search" className="sr-only">Search venues</label>
          <input
            id="venue-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search venues or fields"
            autoComplete="off"
            className="w-full bg-transparent text-[17px] outline-none"
            style={{ color: "var(--color-apple-ink)" }}
          />
          {search && (
            <button onClick={() => setSearch("")} aria-label="Clear search" className="secondary-button" style={{ fontSize: 15 }}>Clear</button>
          )}
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          {(["ALL", "Conference", "Journal"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              aria-pressed={filter === f}
              className={filter === f ? "tag-pill crimson" : "tag-pill"}
              style={{ cursor: "pointer", padding: "7px 16px", fontSize: 14 }}
            >
              {f === "ALL" ? "All" : f === "Conference" ? "Conferences" : "Journals"}
            </button>
          ))}
          <span aria-hidden style={{ color: "var(--liquid-border)", margin: "0 4px" }}>|</span>
          {(["deadline", "acceptance"] as Sort[]).map((s) => (
            <button
              key={s}
              onClick={() => setSort(s)}
              aria-pressed={sort === s}
              className={sort === s ? "tag-pill crimson" : "tag-pill"}
              style={{ cursor: "pointer", padding: "7px 16px", fontSize: 14 }}
            >
              {s === "deadline" ? "By deadline" : "Easiest first"}
            </button>
          ))}
        </div>
        <p className="tech-label mt-3 text-center" style={{ color: "var(--color-slate)" }}>
          {list.length} venues
        </p>
      </section>

      <section id="venues" aria-label="Venues" className="mt-5 grid scroll-mt-24 gap-5">
        {list.length === 0 && (
          <div className="gallery-card rise rise-1 py-10 text-center">
            <p style={{ fontSize: 21, fontWeight: 600, color: "var(--color-apple-ink)" }}>Nothing matched that search.</p>
            <p className="mt-2" style={{ fontSize: 17, color: "var(--color-graphite)" }}>Try a different field or venue name.</p>
          </div>
        )}
        {list.map((v, i) => (
          <article
            key={v.id}
            className={`gallery-card hover-lift rise rise-${(i % 6) + 1} grid gap-2 sm:grid-cols-[1fr_220px] sm:items-start`}
          >
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 style={{ fontSize: 19, fontWeight: 600, letterSpacing: "-0.015em", color: "var(--color-apple-ink)" }}>{v.name}</h2>
                <span className="tag-pill">{v.type}</span>
              </div>
              <p className="mt-1.5" style={{ fontSize: 15, color: "var(--color-slate)" }}>
                {v.field} · {v.location} · Accepts {v.acceptance} · {v.fee}
              </p>
              <p className="mt-1.5 max-w-xl" style={{ fontSize: 17, color: "var(--color-iron)", lineHeight: 1.55 }}>
                <span style={{ fontWeight: 600, color: "var(--color-apple-ink)" }}>For students: </span>{v.whyStudents}
              </p>
            </div>
            <div className="sm:text-right">
              <Countdown v={v} />
              <p className="footnote mt-2">
                {v.deadline ? "Submission deadline" : "No deadline"}
              </p>
            </div>
          </article>
        ))}
      </section>

      <p className="footnote rise rise-2 mt-4 text-center">
        Dates are indicative for planning — always confirm on the official venue site.
      </p>

      <section className="gallery-card rise rise-4 mb-4 mt-8 text-center">
        <p className="eyebrow"><span className="dot" aria-hidden /> Picked a venue?</p>
        <p className="mt-3" style={{ fontFamily: "var(--font-sf-pro-display)", fontSize: 32, fontWeight: 600, letterSpacing: "-0.03em", color: "var(--color-apple-ink)" }}>
          Work backwards from its deadline.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Link href="/roadmap" className="primary-button">
            See the roadmap
          </Link>
          <Link href="/toolkit" className="ghost-pill">
            Writing toolkit
          </Link>
        </div>
      </section>
    </div>
  );
}
