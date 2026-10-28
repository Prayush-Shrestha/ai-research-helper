"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LogoMark } from "@/components/layout/Logo";
import { useAuth } from "@/hooks/useAuth";
import { loginSchema, type LoginInput } from "@/lib/schemas";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="mt-1.5" style={{ fontSize: 13.5, color: "var(--color-alert)" }}>
      {message}
    </p>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const { login, user, loading } = useAuth();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginInput) {
    try {
      await login(values);
    } catch (err) {
      setError("root", {
        message: err instanceof Error ? err.message : "Sign in failed. Please try again.",
      });
    }
  }

  useEffect(() => {
    if (!loading && user) {
      if (user.role === "admin") {
        router.replace("/admin");
      } else {
        router.replace("/dashboard");
      }
    }
  }, [loading, user, router]);

  return (
    <div className="page-enter relative min-h-screen">
      <header className="relative" style={{ height: 72 }}>
        <div className="mx-auto flex h-full items-center justify-between px-5 sm:px-8" style={{ maxWidth: "var(--page-max-width)" }}>
          <Link href="/" className="flex items-center gap-2.5">
            <LogoMark size={28} />
            <span style={{ fontSize: 17, fontWeight: 650, letterSpacing: "-0.02em", color: "var(--color-apple-ink)" }}>Lumina</span>
          </Link>
          <Link href="/register" className="ghost-pill" style={{ fontSize: 13.5, padding: "8px 18px" }}>Create account</Link>
        </div>
      </header>
      <main className="relative mx-auto px-5 sm:px-8" style={{ maxWidth: 520 }}>
        <section className="rise rise-1 pt-8 text-center sm:pt-12">
          <span className="eyebrow"><span className="dot" /> Welcome back</span>
          <h1 className="mt-4" style={{ fontSize: "clamp(34px,5vw,46px)", fontWeight: 650, letterSpacing: "-0.03em", lineHeight: 1.05, color: "var(--color-apple-ink)" }}>
            Good to see you<br />again.
          </h1>
          <p className="mt-3" style={{ fontSize: 16, color: "var(--color-graphite)" }}>Your library is right where you left it.</p>

          <div className="gallery-card rise rise-2 mt-8 text-left !p-7">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <div>
                <label htmlFor="email" className="mb-1.5 block text-[14px] font-semibold" style={{ color: "var(--color-apple-ink)" }}>Email</label>
                <input
                  id="email" type="email" autoComplete="email"
                  placeholder="you@university.edu"
                  aria-invalid={Boolean(errors.email)}
                  className="field-input"
                  {...register("email")}
                />
                <FieldError message={errors.email?.message} />
              </div>
              <div>
                <label htmlFor="password" className="mb-1.5 block text-[14px] font-semibold" style={{ color: "var(--color-apple-ink)" }}>Password</label>
                <input
                  id="password" type="password" autoComplete="current-password"
                  placeholder="Your password"
                  aria-invalid={Boolean(errors.password)}
                  className="field-input"
                  {...register("password")}
                />
                <FieldError message={errors.password?.message} />
              </div>
              {errors.root && (
                <p role="alert" className="rounded-2xl px-4 py-3" style={{ fontSize: 14, color: "var(--color-alert)", background: "rgba(255,155,138,0.08)", border: "1px solid rgba(255,155,138,0.25)" }}>
                  {errors.root.message}
                </p>
              )}
              <button
                type="submit" disabled={isSubmitting}
                className="primary-button w-full"
                style={{ opacity: isSubmitting ? 0.6 : 1, padding: "13px" }}
              >
                {isSubmitting ? "Signing in…" : "Sign in →"}
              </button>
            </form>
          </div>

          <p className="mt-5" style={{ fontSize: 15, color: "var(--color-graphite)" }}>
            New here? <Link href="/register" style={{ color: "var(--color-link-blue)", fontWeight: 600 }}>Create an account</Link>
          </p>
        </section>
      </main>
    </div>
  );
}
