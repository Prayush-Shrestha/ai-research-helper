import Link from "next/link";
import { SectionDivider } from "@/components/editorial/TechnicalLabel";

const STEPS = [
  {
    n: "01",
    title: "Run it",
    body: "npm install, then npm run dev, then open http://localhost:3002. That's it. You don't need the backend — the app ships with a local demo mode so you can click around straight away.",
    code: "npm install\nnpm run dev",
  },
  {
    n: "02",
    title: "Make an account",
    body: "Hit ENTER WORKSPACE on the home page. It asks for a name, email, and a password (6+ characters). In demo mode any email works — it just stores things in your browser. If you already signed up, use Sign in instead.",
    code: null,
  },
  {
    n: "03",
    title: "Look around the dashboard",
    body: "The dashboard is just an overview — how many docs you have, the 5 most recent ones, and some placeholder signals. Two buttons matter: OPEN LIBRARY takes you to your files, ASK RESEARCH opens the assistant preview.",
    code: null,
  },
  {
    n: "04",
    title: "Upload your first paper",
    body: "Go to Research Library (/documents) and press UPLOAD DOCUMENT +. Pick a PDF or DOCX. You'll see it go through Extracting → Indexing → Indexed. In demo mode it fakes the extracted text so the reader has something to show.",
    code: null,
  },
  {
    n: "05",
    title: "Find things again",
    body: "The search box matches titles and filenames. FILTER switches between ALL / PDF / DOCX, SORT does RECENT / OLDEST / A–Z. The little counter on the right tells you how many matches you got.",
    code: null,
  },
  {
    n: "06",
    title: "Read, rename, delete",
    body: "Click any row to open the reader. Top line shows type, pages, size, status, date. You can RENAME inline, DOWNLOAD (just prints), or DELETE (it asks first, no undo). The AI box at the bottom is a placeholder — real answers come in month 2.",
    code: null,
  },
];

export default function GuidePage() {
  return (
    <main className="mx-auto px-5 sm:px-8" style={{ maxWidth: "var(--page-width)" }}>
      <section className="pt-12 sm:pt-16">
        <p className="font-tech" style={{ color: "var(--color-tertiary-text)" }}>
          MANUAL / 00 — START HERE
        </p>
        <h1
          className="font-display mt-2"
          style={{ fontSize: "clamp(48px,7vw,84px)", lineHeight: 0.95, letterSpacing: "-2px" }}
        >
          How to use
          <br />
          this thing
        </h1>
        <p className="mt-4 max-w-lg text-[15px]" style={{ color: "var(--color-secondary-text)", lineHeight: 1.7 }}>
          I wrote this page because the app can feel a bit empty the first time you open it.
          Five minutes here and you&apos;ll know where everything lives and why it works the way it does.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Link
            href="/register"
            className="font-tech rounded-full px-6 py-3"
            style={{ background: "var(--color-primary-text)", color: "#050505", fontSize: 10 }}
          >
            CREATE ACCOUNT →
          </Link>
          <Link
            href="/documents"
            className="font-tech rounded-full px-6 py-3"
            style={{ border: "1px solid var(--color-hairline)", color: "var(--color-secondary-text)", fontSize: 10 }}
          >
            SKIP TO LIBRARY
          </Link>
        </div>
      </section>

      <div className="mt-10">
        <SectionDivider label="WHAT THIS APP ACTUALLY IS" />
      </div>
      <section className="grid gap-8 py-8 lg:grid-cols-[1fr_1fr]">
        <div>
          <p className="text-[15px]" style={{ color: "var(--color-secondary-text)", lineHeight: 1.8 }}>
            Think of it as a private shelf for your papers. You upload PDFs, the app pulls out the text,
            and you get a clean reading view instead of wrestling with raw PDFs. Search and filters sit on
            top so you can actually find things again.
          </p>
          <p className="mt-4 text-[15px]" style={{ color: "var(--color-secondary-text)", lineHeight: 1.8 }}>
            The AI side — asking questions, getting cited answers — isn&apos;t wired up yet. The assistant,
            knowledge map and insights pages are previews of where that&apos;ll live. Month 1 was just about
            getting the boring foundation right: login, upload, storage, reading.
          </p>
        </div>
        <div
          className="px-6 py-6"
          style={{ border: "1px solid var(--color-hairline)", borderRadius: "var(--radius-panel)", background: "var(--color-deep-black)" }}
        >
          <p className="micro-label" style={{ color: "var(--color-tertiary-text)" }}>UNDER THE HOOD, briefly</p>
          <ul className="mt-3 space-y-2 text-[14px]" style={{ color: "var(--color-secondary-text)", lineHeight: 1.7 }}>
            <li>— Next.js App Router, one route per folder in <span className="font-tech">src/app</span>.</li>
            <li>— All backend calls live in <span className="font-tech">src/lib/api.ts</span> and nowhere else.</li>
            <li>— Login token sits in localStorage as <span className="font-tech">ara_token</span>.</li>
            <li>— No backend running? It falls back to demo data in <span className="font-tech">src/lib/mock.ts</span>.</li>
          </ul>
          <p className="font-tech mt-4" style={{ color: "var(--color-tertiary-text)", fontSize: 10 }}>
            .env.local → NEXT_PUBLIC_API_URL + NEXT_PUBLIC_USE_MOCK
          </p>
        </div>
      </section>

      <SectionDivider label="FIRST TIME? DO THIS IN ORDER" />
      <section style={{ borderTop: "1px solid var(--color-hairline)" }}>
        {STEPS.map((s) => (
          <div
            key={s.n}
            className="grid gap-3 py-7 sm:grid-cols-[56px_1fr_280px] sm:items-start"
            style={{ borderBottom: "1px solid var(--color-hairline)" }}
          >
            <span className="font-tech" style={{ color: "var(--color-tertiary-text)" }}>{s.n}</span>
            <div>
              <h2 className="text-[17px] font-medium tracking-tight" style={{ color: "var(--color-primary-text)" }}>
                {s.title}
              </h2>
              <p className="mt-1 max-w-xl text-[14px]" style={{ color: "var(--color-secondary-text)", lineHeight: 1.7 }}>
                {s.body}
              </p>
            </div>
            <div>
              {s.code ? (
                <pre
                  className="font-tech px-4 py-3"
                  style={{ background: "#111214", border: "1px solid var(--color-hairline)", borderRadius: 8, fontSize: 11, color: "var(--color-primary-text)", whiteSpace: "pre-wrap" }}
                >
                  {s.code}
                </pre>
              ) : (
                <p className="font-tech" style={{ color: "var(--color-tertiary-text)", fontSize: 10 }}>
                  NO SETUP NEEDED
                </p>
              )}
            </div>
          </div>
        ))}
      </section>

      <SectionDivider label="THINGS PEOPLE TRIP ON" />
      <section className="grid gap-8 py-8 sm:grid-cols-3">
        {[
          ["I got sent back to login?", "Your token expired or got cleared. Just sign in again. Demo data stays put."],
          ["Upload says it can't reach the server?", "Totally normal without the backend. Demo mode catches that and saves locally instead."],
          ["Library is empty?", "Either you haven't uploaded yet, or you cleared storage. Upload one PDF and it seeds from there."],
          ["Where's the AI?", "Assistant page is a mock for now. It shows a sample answer so you can see the layout. Real Q&A lands next."],
          ["How do I start over?", "Settings → RESET clears the demo library on that browser. Or wipe localStorage in devtools."],
          ["Which files work?", "PDF and DOCX. Anything else gets treated as PDF in demo mode — the real backend will validate properly."],
        ].map(([q, a]) => (
          <div key={q}>
            <p className="text-[14px] font-medium" style={{ color: "var(--color-primary-text)" }}>{q}</p>
            <p className="mt-1 text-[13px]" style={{ color: "var(--color-secondary-text)", lineHeight: 1.7 }}>{a}</p>
          </div>
        ))}
      </section>

      <section
        className="mb-4 px-6 py-8 text-center sm:px-12"
        style={{ border: "1px solid var(--color-hairline)", borderRadius: "var(--radius-panel)", background: "var(--color-deep-black)" }}
      >
        <p className="font-tech" style={{ color: "var(--color-tertiary-text)", fontSize: 10 }}>READY WHEN YOU ARE</p>
        <p className="font-display mx-auto mt-2" style={{ fontSize: "clamp(26px,4vw,40px)", maxWidth: 560, lineHeight: 1.1 }}>
          Upload one paper. That&apos;s the whole trick.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <Link
            href="/documents"
            className="font-tech rounded-full px-7 py-3"
            style={{ background: "var(--color-primary-text)", color: "#050505", fontSize: 11 }}
          >
            OPEN MY LIBRARY →
          </Link>
          <Link
            href="/dashboard"
            className="font-tech px-4 py-3"
            style={{ color: "var(--color-secondary-text)", fontSize: 11 }}
          >
            back to dashboard
          </Link>
        </div>
      </section>
    </main>
  );
}
