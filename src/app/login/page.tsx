"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Wordmark } from "@/components/layout/Logo";
import { useAuth } from "@/hooks/useAuth";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("Email and password are required.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await login({ email: email.trim(), password });
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page-enter min-h-screen" style={{ background: "var(--color-void)" }}>
      <header style={{ height: 72, borderBottom: "1px solid #292B2D" }}>
        <div className="mx-auto flex h-full items-center justify-between px-5 sm:px-8" style={{ maxWidth: "var(--page-width)" }}>
          <Link href="/"><Wordmark /></Link>
          <p className="font-tech" style={{ color: "var(--color-tertiary-text)", fontSize: 10 }}>ACCESS / SIGN IN</p>
        </div>
      </header>
      <main className="mx-auto px-5 sm:px-8" style={{ maxWidth: 560 }}>
        <section className="pt-16 sm:pt-24">
          <p className="font-tech" style={{ color: "var(--color-tertiary-text)" }}>AUTH / 01</p>
          <h1 className="font-display mt-3" style={{ fontSize: 56, lineHeight: 1 }}>Return to your research.</h1>
          <p className="mt-3 text-[15px]" style={{ color: "var(--color-secondary-text)" }}>Your laboratory is preserved exactly as you left it.</p>

          <form onSubmit={onSubmit} className="mt-10 space-y-5" noValidate>
            <div>
              <label htmlFor="email" className="micro-label block" style={{ color: "var(--color-tertiary-text)" }}>EMAIL</label>
              <input
                id="email" type="email" autoComplete="email" required value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@university.edu"
                className="mt-2 w-full bg-transparent px-0 py-3 text-[16px] outline-none"
                style={{ borderBottom: "1px solid #292B2D", color: "var(--color-primary-text)", borderRadius: 0 }}
              />
            </div>
            <div>
              <label htmlFor="password" className="micro-label block" style={{ color: "var(--color-tertiary-text)" }}>PASSWORD</label>
              <input
                id="password" type="password" autoComplete="current-password" required value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-2 w-full bg-transparent px-0 py-3 text-[16px] outline-none"
                style={{ borderBottom: "1px solid #292B2D", color: "var(--color-primary-text)", borderRadius: 0 }}
              />
            </div>
            {error && <p role="alert" className="font-tech" style={{ color: "#ff9d9d", fontSize: 11 }}>{error.toUpperCase()}</p>}
            <button
              type="submit" disabled={submitting}
              className="font-tech w-full rounded-full py-4"
              style={{ background: "var(--color-primary-text)", color: "#050505", fontSize: 12, opacity: submitting ? 0.6 : 1 }}
            >
              {submitting ? "VERIFYING…" : "ENTER WORKSPACE →"}
            </button>
          </form>

          <div className="mt-8 flex items-center justify-between" style={{ borderTop: "1px solid #292B2D", paddingTop: 20 }}>
            <p className="text-[13px]" style={{ color: "var(--color-secondary-text)" }}>
              No access? <Link href="/register" style={{ color: "var(--color-primary-text)" }}>Create account</Link>
            </p>
            <p className="font-tech" style={{ color: "var(--color-tertiary-text)", fontSize: 10 }}>POST /AUTH/LOGIN</p>
          </div>
        </section>
      </main>
    </div>
  );
}
