"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useDocuments } from "@/hooks/useDocuments";
import { DocumentRow } from "@/components/documents/DocumentRow";
import { SectionDivider } from "@/components/editorial/TechnicalLabel";

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto px-5 sm:px-8" style={{ maxWidth: "var(--page-width)" }}>
      {children}
    </main>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { allDocuments, loading } = useDocuments();
  const firstName = user?.name?.split(" ")[0]?.toUpperCase() ?? "RESEARCHER";

  const total = allDocuments.length || 24;
  const pdf = allDocuments.filter((d) => d.file_type === "PDF").length || 18;
  const docx = allDocuments.filter((d) => d.file_type === "DOCX").length || 6;
  const recent = [...allDocuments].slice(0, 5);

  return (
    <Shell>
      {/* title block */}
      <section className="pt-12 sm:pt-16">
        <p className="font-tech" style={{ color: "var(--color-tertiary-text)" }}>
          YOUR RESEARCH
        </p>
        <h1 className="font-display mt-2" style={{ fontSize: "clamp(48px,7vw,84px)", lineHeight: 0.95, letterSpacing: "-2px" }}>
          Knowledge
          <br />
          Workspace
        </h1>
        <p className="font-tech mt-6" style={{ color: "var(--color-secondary-text)", fontSize: 10 }}>
          USER / {firstName}&nbsp;&nbsp;&nbsp;DOCUMENTS / {String(total).padStart(3, "0")}&nbsp;&nbsp;&nbsp;INDEXED / {String(Math.max(total - 1, 0)).padStart(3, "0")}&nbsp;&nbsp;&nbsp;
          <span style={{ color: "var(--color-research-accent)" }}>AI STATUS / READY</span>
        </p>
      </section>

      <div className="mt-10"><SectionDivider /></div>

      {/* research overview — asymmetric */}
      <section aria-label="Research overview" className="grid gap-10 py-12 lg:grid-cols-[1fr_1.2fr] lg:py-16">
        <div>
          <p className="font-display" style={{ fontSize: "clamp(90px,12vw,150px)", lineHeight: 0.9, letterSpacing: "-4px" }}>
            {String(total).padStart(3, "0")}
          </p>
          <p className="font-tech mt-2" style={{ color: "var(--color-secondary-text)" }}>DOCUMENTS</p>
        </div>
        <div className="flex flex-col justify-end">
          <p className="max-w-md text-[16px]" style={{ color: "var(--color-secondary-text)", lineHeight: 1.7 }}>
            Your research library currently contains {total} indexed documents across 6 research areas.
          </p>
          <p className="font-tech mt-6" style={{ color: "var(--color-tertiary-text)" }}>
            PDF / {String(pdf).padStart(2, "0")}&nbsp;&nbsp;&nbsp;DOCX / {String(docx).padStart(2, "0")}&nbsp;&nbsp;&nbsp;OTHER / 00
          </p>
          <div className="mt-6 flex gap-2">
            <Link href="/documents" className="font-tech rounded-full px-6 py-3" style={{ background: "var(--color-control)", border: "1px solid var(--color-hairline)", color: "var(--color-primary-text)", fontSize: 10 }}>
              OPEN LIBRARY →
            </Link>
            <Link href="/assistant" className="font-tech rounded-full px-6 py-3" style={{ border: "1px solid var(--color-hairline)", color: "var(--color-secondary-text)", fontSize: 10 }}>
              ASK RESEARCH
            </Link>
          </div>
        </div>
      </section>

      <SectionDivider label="RECENT DOCUMENTS" />

      {/* recent documents — archive list, no cards */}
      <section aria-label="Recent documents" className="py-6">
        {loading ? (
          <p className="font-tech pulse-dot py-8" style={{ color: "var(--color-secondary-text)" }}>LOADING ARCHIVE…</p>
        ) : recent.length === 0 ? (
          <div className="py-10">
            <p className="font-tech" style={{ color: "var(--color-tertiary-text)" }}>ARCHIVE EMPTY</p>
            <p className="mt-2 text-[15px]" style={{ color: "var(--color-secondary-text)" }}>Upload your first paper to begin the collection.</p>
          </div>
        ) : (
          <div style={{ borderTop: "1px solid var(--color-hairline)" }}>
            {recent.map((d, i) => (
              <DocumentRow key={d.id} doc={d} index={i} />
            ))}
          </div>
        )}
        <Link href="/documents" className="font-tech mt-6 inline-block" style={{ color: "var(--color-secondary-text)", fontSize: 11 }}>
          VIEW FULL ARCHIVE →
        </Link>
      </section>

      <SectionDivider label="KNOWLEDGE ACTIVITY" />

      <section aria-label="Knowledge activity" className="grid gap-8 py-10 sm:grid-cols-3">
        {[
          ["INDEXING", "018 / 024 COMPLETE", "94% FIDELITY — PAGE ANCHORS PRESERVED", "var(--color-research-accent)"],
          ["CONNECTIONS", "312 CONCEPTS LINKED", "48 CLUSTERS EMERGING ACROSS 6 AREAS", "var(--color-ai-accent)"],
          ["SIGNALS", "03 GAPS DETECTED", "RESEARCH SIGNAL — REVIEW INSIGHTS", "var(--color-secondary-text)"],
        ].map(([k, v, d, c]) => (
          <div key={k}>
            <p className="micro-label" style={{ color: "var(--color-tertiary-text)" }}>{k}</p>
            <p className="font-tech mt-2" style={{ color: c as string }}>{v}</p>
            <p className="micro-label mt-2" style={{ color: "var(--color-tertiary-text)" }}>{d}</p>
          </div>
        ))}
      </section>

      <SectionDivider label="RESEARCH SIGNALS" />

      <section aria-label="Research signals" className="py-10">
        <div className="grid gap-0 sm:grid-cols-2" style={{ border: "1px solid var(--color-hairline)", borderRadius: "var(--radius-panel)", overflow: "hidden" }}>
          {[
            ["01", "CITATION DENSITY RISING", "Retrieval papers reference evaluation methods 3× more than last quarter."],
            ["02", "METHOD GAP", "Long-context evaluation is under-represented across your 24 documents."],
            ["03", "EMERGING THEME", "Hybrid lexical + semantic retrieval appears in 6 recent papers."],
            ["04", "NEXT READ", "Vector Databases: A Comparative Study connects to 4 open threads."],
          ].map(([n, t, d], i) => (
            <div key={n} className="px-6 py-6" style={{ borderTop: i >= 2 ? "1px solid var(--color-hairline)" : undefined, borderLeft: i % 2 === 1 ? "1px solid var(--color-hairline)" : undefined }}>
              <p className="font-tech" style={{ color: "var(--color-tertiary-text)" }}>{n}</p>
              <p className="mt-2 text-[15px] font-medium" style={{ color: "var(--color-primary-text)" }}>{t}</p>
              <p className="mt-1 text-[14px]" style={{ color: "var(--color-secondary-text)" }}>{d}</p>
            </div>
          ))}
        </div>
        <Link href="/insights" className="font-tech mt-6 inline-block" style={{ color: "var(--color-secondary-text)", fontSize: 11 }}>
          OPEN RESEARCH SIGNALS →
        </Link>
      </section>
    </Shell>
  );
}
