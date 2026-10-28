"use client";

import { useCallback, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { suggestTopics, type SuggestTopicsOut, type TopicSuggestion } from "@/lib/api";
import { ApiError } from "@/lib/api";

/* Small badge that marks the best topic. */
function BestBadge() {
  return (
    <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "#fff", background: "var(--color-electric-blue)", padding: "2px 8px", borderRadius: 999, marginLeft: 8 }}>
      Best fit
    </span>
  );
}

/* One topic suggestion card. */
function TopicCard({ topic, index }: { topic: TopicSuggestion; index: number }) {
  const isBest = topic.is_best;
  return (
    <div className="gallery-card !p-5" style={{ borderLeft: isBest ? "4px solid var(--color-electric-blue)" : "1px solid var(--liquid-border-soft)", marginBottom: 16 }}>
      <div className="flex items-baseline justify-between gap-3 mb-3">
        <h3 style={{ fontSize: 17, fontWeight: 650, letterSpacing: "-0.01em", color: "var(--color-apple-ink)" }}>
          {topic.title}{isBest && <BestBadge />}
        </h3>
        <span className={`tag-pill ${isBest ? "crimson" : ""}`}>{index + 1}</span>
      </div>
      <p className="mt-2 mb-4" style={{ fontSize: 14.5, color: "var(--color-graphite)", lineHeight: 1.6 }}>
        {topic.description}
      </p>
      <div className="space-y-3">
        <div>
          <p style={{ fontSize: 11.5, fontWeight: 650, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-slate)", marginBottom: 4 }}>Why this fits</p>
          <p style={{ fontSize: 14.5, color: "var(--color-apple-ink)", margin: 0 }}>{topic.why_it_fits}</p>
        </div>
        <div>
          <p style={{ fontSize: 11.5, fontWeight: 650, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-slate)", marginBottom: 4 }}>Suggested approach</p>
          <p style={{ fontSize: 14.5, color: "var(--color-apple-ink)", margin: 0 }}>{topic.suggested_approach}</p>
        </div>
      </div>
    </div>
  );
}

export default function ResearchTopicsPage() {
  const { user } = useAuth();
  const [description, setDescription] = useState("");
  const [result, setResult] = useState<SuggestTopicsOut | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await suggestTopics(description.trim());
      setResult(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not suggest topics. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [description]);

  return (
    <div>
      <section className="rise rise-1 relative pt-6 sm:pt-10"><span className="eyebrow"><span className="dot" /> Research topics</span>
        <h1 className="mt-4" style={{ fontSize: "clamp(28px,5vw,42px)", fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1.1, color: "var(--color-apple-ink)" }}>
          What do you want to research?
        </h1>
        <p className="hero-sub mt-3 max-w-xl">
          Tell me a bit about what interests you, and I&apos;ll suggest a few
          concrete topics — plus which one fits best.
        </p>
      </section>

      <form onSubmit={handleSubmit} className="rise rise-2 mx-auto mt-8 gallery-card !p-6" style={{ maxWidth: 720 }}>
        <label htmlFor="research-description" style={{ display: "block", fontSize: 14.5, fontWeight: 600, color: "var(--color-apple-ink)", marginBottom: 8 }}>
          Describe your research interest
        </label>
        <textarea
          id="research-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. I want to study how machine learning can help detect early signs of disease in medical images…"
          rows={5}
          className="w-full field-input mb-4"
          style={{ resize: "vertical" }}
        />
        <p className="text-[12px] text-slate mb-5" style={{ color: "var(--color-slate)" }}>
          Be as specific as you like — more detail means better suggestions.
        </p>
        <button type="submit" disabled={loading || !description.trim()} className="primary-button" style={{ opacity: loading || !description.trim() ? 0.6 : 1 }}>
          {loading ? "Finding topics…" : "Suggest topics"}
        </button>
      </form>

      {error && (
        <p role="alert" className="rise rise-3 mx-auto mt-6 rounded-2xl px-5 py-3" style={{ maxWidth: 720, fontSize: 14.5, color: "var(--color-alert)", background: "rgba(255,155,138,0.08)", border: "1px solid rgba(255,155,138,0.25)" }}>
          {error}
        </p>
      )}

      {result && (
        <section className="rise rise-4 mx-auto mt-8 gallery-card !p-6" style={{ maxWidth: 720 }}>
          <div className="flex items-baseline justify-between gap-4 mb-5">
            <div>
              <p style={{ fontSize: 11, fontWeight: 650, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-slate)" }}>Suggested topics</p>
              <p style={{ fontSize: 17, fontWeight: 650, color: "var(--color-apple-ink)" }}>{result.topics.length} topic{result.topics.length === 1 ? "" : "s"} found</p>
            </div>
            {result.note && <p style={{ fontSize: 14.5, color: "var(--color-graphite)" }}>{result.note}</p>}
          </div>
          {result.topics.map((topic, i) => (
            <TopicCard key={i} topic={topic} index={i} />
          ))}
          {result.best_topic_index !== null && result.topics[result.best_topic_index] && (
            <p className="mt-6 pt-6" style={{ borderTop: "1px solid var(--liquid-border-soft)", fontSize: 14.5, color: "var(--color-graphite)", lineHeight: 1.65 }}>
              <strong style={{ color: "var(--color-apple-ink)" }}>My recommendation:</strong>{" "}
              {result.topics[result.best_topic_index].title}{" "}
              — it matched the most from your description, so it&apos;s probably the best place to start.
            </p>
          )}
        </section>
      )}

      {!result && !error && !loading && (
        <p className="rise rise-3 mx-auto mt-8 text-center" style={{ maxWidth: 720, fontSize: 14.5, color: "var(--color-graphite)", lineHeight: 1.65 }}>
          Signed in as <strong style={{ color: "var(--color-apple-ink)" }}>{user?.email}</strong>. Type something above to get started.
        </p>
      )}
    </div>
  );
}

