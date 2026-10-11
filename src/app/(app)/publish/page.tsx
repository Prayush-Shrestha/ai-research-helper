"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { SectionDivider } from "@/components/editorial/TechnicalLabel";
import { VENUES, daysUntil, formatDeadline, type Venue } from "@/lib/student";

type Filter = "ALL" | "Conference" | "Journal";
type Sort = "deadline" | "acceptance";

function Countdown({ v }: { v: Venue }) {
  if (!v.deadline) {
    return (
      <span className="font-tech" style={{ color: "var(--color-ai-accent)", fontSize: 10 }}>
        ROLLING — APPLY ANYTIME
      </span>
    );
  }
  const days = daysUntil(v.deadline);
  const urgent = days <= 45;
  return (
    <span className="font-tech" style={{ color: urgent ? "#ff9d9d" : "var(--color-research-accent)", fontSize: 10 }}>
      {days < 0 ? "PASSED — SEE NEXT EDITION" : days === 0 ? "DUE TODAY" : `${days} DAYS LEFT · ${formatDeadline(v.deadline)}`}
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

  const pill = (active: boolean): React.CSSProperties => ({
    border: "1px solid var(--color-hairline)",
    background: active ? "var(--color-primary-text)" : "var(--color-control)",
    color: active ? "#050505" : "var(--color-secondary-text)",
    borderRadius: 100,
    fontSize: 10,
  });

  return (
    <main className="mx-auto px-5 sm:px-8" style={{ maxWidth: "var(--page-width)" }}>
      <section className="pt-12 sm:pt-16">
        <p className="font-tech" style={{ color: "var(--color-tertiary-text)" }}>PUBLISH / 07 — FOR STUDENTS</p>
        <h1
          className="font-display mt-2"
          style={{ fontSize: "clamp(48px,7vw,84px)", lineHeight: 0.95, letterSpacing: "-2px" }}
        >
          Get published
          <br />
          before you apply.
        </h1>
        <p className="mt-4 max-w-lg text-[15px]" style={{ color: "var(--color-secondary-text)", lineHeight: 1.7 }}>
          One published line on your SOP changes how committees read you. These venues welcome
          student and first-time authors — pick one by deadline and work backwards.
        </p>
      </section>

      <div className="mt-10"><SectionDivider label="WHY THIS MATTERS ABROAD" /></div>
      <section className="grid gap-8 py-8 sm:grid-cols-3">
        {[
          ["PROOF, NOT PROMISES", "A paper says you can finish research. Grades only say you can pass exams."],
          ["SHORT COUNTS", "Workshops and 2–4 page tracks accept student work. You don't need a full paper."],
          ["ROLLING HAS NO GATE", "Journals with rolling review let you submit the month your draft is ready."],
        ].map(([k, v]) => (
          <div key={k}>
            <p className="micro-label" style={{ color: "var(--color-tertiary-text)" }}>{k}</p>
            <p className="mt-2 text-[14px]" style={{ color: "var(--color-secondary-text)", lineHeight: 1.7 }}>{v}</p>
          </div>
        ))}
      </section>

      <SectionDivider label="VENUES THAT WELCOME STUDENTS" />

      <section aria-label="Venue controls" className="mt-6" style={{ borderTop: "1px solid var(--color-hairline)", borderBottom: "1px solid var(--color-hairline)", padding: "20px 0" }}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 items-center gap-3">
            <span className="font-tech" style={{ color: "var(--color-tertiary-text)" }}>⌕</span>
            <label htmlFor="venue-search" className="sr-only">Search venues</label>
            <input
              id="venue-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="SEARCH VENUES OR FIELDS —"
              autoComplete="off"
              className="font-tech w-full bg-transparent py-2 outline-none placeholder:text-[#62686A]"
              style={{ color: "var(--color-primary-text)", fontSize: 12 }}
            />
            {search && (
              <button onClick={() => setSearch("")} aria-label="Clear search" className="font-tech" style={{ color: "var(--color-tertiary-text)", fontSize: 10 }}>CLEAR ✕</button>
            )}
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="micro-label mr-1" style={{ color: "var(--color-tertiary-text)" }}>TYPE</span>
          {(["ALL", "Conference", "Journal"] as Filter[]).map((f) => (
            <button key={f} onClick={() => setFilter(f)} aria-pressed={filter === f} className="font-tech rounded-full px-4 py-1.5" style={pill(filter === f)}>
              {f === "ALL" ? "ALL" : f === "Conference" ? "CONFERENCES" : "JOURNALS"}
            </button>
          ))}
          <span className="micro-label ml-4 mr-1" style={{ color: "var(--color-tertiary-text)" }}>SORT</span>
          {(["deadline", "acceptance"] as Sort[]).map((s) => (
            <button key={s} onClick={() => setSort(s)} aria-pressed={sort === s} className="font-tech rounded-full px-4 py-1.5" style={pill(sort === s)}>
              {s === "deadline" ? "DEADLINE" : "EASIEST FIRST"}
            </button>
          ))}
          <span className="font-tech ml-auto" style={{ color: "var(--color-tertiary-text)", fontSize: 10 }}>
            {String(list.length).padStart(2, "0")} VENUES
          </span>
        </div>
      </section>

      <section aria-label="Venues" className="mt-4" style={{ borderTop: "1px solid var(--color-hairline)" }}>
        {list.length === 0 && (
          <div className="py-12">
            <p className="font-tech" style={{ color: "var(--color-tertiary-text)" }}>NO MATCHES</p>
            <p className="mt-2 text-[15px]" style={{ color: "var(--color-secondary-text)" }}>Try a different field or venue name.</p>
          </div>
        )}
        {list.map((v, i) => (
          <article
            key={v.id}
            className="grid gap-3 py-6 sm:grid-cols-[56px_1fr_200px] sm:items-start"
            style={{ borderBottom: "1px solid var(--color-hairline)" }}
          >
            <span className="font-tech" style={{ color: "var(--color-tertiary-text)" }}>{String(i + 1).padStart(2, "0")}</span>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-[17px] font-medium tracking-tight" style={{ color: "var(--color-primary-text)" }}>{v.name}</h2>
                <span
                  className="font-tech rounded-full px-3 py-1"
                  style={{
                    fontSize: 9,
                    border: "1px solid var(--color-hairline)",
                    background: v.type === "Conference" ? "rgba(183,255,223,0.07)" : "rgba(140,200,255,0.07)",
                    color: v.type === "Conference" ? "var(--color-research-accent)" : "var(--color-ai-accent)",
                  }}
                >
                  {v.type.toUpperCase()}
                </span>
              </div>
              <p className="font-tech mt-2" style={{ color: "var(--color-tertiary-text)", fontSize: 10 }}>
                {v.field.toUpperCase()} · {v.location.toUpperCase()} · ACCEPT {v.acceptance} · {v.fee.toUpperCase()}
              </p>
              <p className="mt-2 max-w-xl text-[14px]" style={{ color: "var(--color-secondary-text)", lineHeight: 1.7 }}>
                <span style={{ color: "var(--color-primary-text)" }}>For students: </span>{v.whyStudents}
              </p>
            </div>
            <div className="sm:text-right">
              <Countdown v={v} />
              <p className="font-tech mt-2" style={{ color: "var(--color-tertiary-text)", fontSize: 10 }}>
                {v.deadline ? "SUBMISSION DEADLINE" : "NO DEADLINE"}
              </p>
            </div>
          </article>
        ))}
      </section>

      <p className="font-tech mt-4" style={{ color: "var(--color-tertiary-text)", fontSize: 10 }}>
        DATES ARE INDICATIVE FOR PLANNING — ALWAYS CONFIRM ON THE OFFICIAL VENUE SITE.
      </p>

      <section
        className="mb-4 mt-10 px-6 py-8 sm:px-10"
        style={{ border: "1px solid var(--color-hairline)", borderRadius: "var(--radius-panel)", background: "var(--color-deep-black)" }}
      >
        <p className="font-tech" style={{ color: "var(--color-tertiary-text)", fontSize: 10 }}>PICKED A VENUE?</p>
        <p className="font-display mt-2" style={{ fontSize: "clamp(26px,4vw,40px)", lineHeight: 1.1 }}>
          Work backwards from its deadline.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link href="/roadmap" className="font-tech rounded-full px-7 py-3" style={{ background: "var(--color-primary-text)", color: "#050505", fontSize: 11 }}>
            SEE THE ROADMAP →
          </Link>
          <Link href="/toolkit" className="font-tech rounded-full px-7 py-3" style={{ border: "1px solid var(--color-hairline)", color: "var(--color-secondary-text)", fontSize: 11 }}>
            WRITING TOOLKIT
          </Link>
        </div>
      </section>
    </main>
  );
}
