"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Wordmark } from "@/components/layout/Logo";
import { useAuth } from "@/hooks/useAuth";
import { registerSchema, type RegisterInput } from "@/lib/schemas";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="mt-1.5" style={{ fontSize: 15, color: "var(--color-alert)" }}>
      {message}
    </p>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const { register: signUp, user, loading } = useAuth();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  async function onSubmit(values: RegisterInput) {
    try {
      await signUp(values);
      router.replace("/dashboard");
    } catch (err) {
      setError("root", {
        message: err instanceof Error ? err.message : "Registration failed. Please try again.",
      });
    }
  }

  // Already signed in — don't show the form again.
  useEffect(() => {
    if (!loading && user) router.replace("/dashboard");
  }, [loading, user, router]);

  return (
    <div className="page-enter min-h-screen" style={{ background: "var(--color-fog-canvas)" }}>
      <header style={{ height: 64 }}>
        <div className="mx-auto flex h-full items-center justify-between px-5 sm:px-8" style={{ maxWidth: "var(--page-max-width)" }}>
          <Link href="/"><Wordmark /></Link>
          <Link href="/login" style={{ fontSize: 15, color: "var(--color-link-blue)" }}>Sign in</Link>
        </div>
      </header>
      <main className="mx-auto px-5 sm:px-8" style={{ maxWidth: 560 }}>
        <section className="pt-10 text-center sm:pt-16">
          <h1 style={{ fontFamily: "var(--font-sf-pro-display)", fontSize: 44, fontWeight: 600, letterSpacing: "-0.009em", lineHeight: 1.1, color: "var(--color-apple-ink)" }}>Create your account.</h1>
          <p className="mt-3" style={{ fontSize: 19, color: "var(--color-graphite)" }}>Free. Your library is ready in a minute.</p>

          <div className="gallery-card mt-8 text-left">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <div>
                <label htmlFor="name" className="mb-1.5 block text-[17px]" style={{ color: "var(--color-apple-ink)" }}>Name</label>
                <input
                  id="name" autoComplete="name"
                  placeholder="Ada Lovelace"
                  aria-invalid={Boolean(errors.name)}
                  className="field-input"
                  {...register("name")}
                />
                <FieldError message={errors.name?.message} />
              </div>
              <div>
                <label htmlFor="email" className="mb-1.5 block text-[17px]" style={{ color: "var(--color-apple-ink)" }}>Email</label>
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
                <label htmlFor="password" className="mb-1.5 block text-[17px]" style={{ color: "var(--color-apple-ink)" }}>Password</label>
                <input
                  id="password" type="password" autoComplete="new-password"
                  placeholder="Minimum 6 characters"
                  aria-invalid={Boolean(errors.password)}
                  className="field-input"
                  {...register("password")}
                />
                <FieldError message={errors.password?.message} />
              </div>
              {errors.root && (
                <p role="alert" style={{ fontSize: 15, color: "var(--color-alert)" }}>
                  {errors.root.message}
                </p>
              )}
              <button
                type="submit" disabled={isSubmitting}
                className="primary-button w-full"
                style={{ opacity: isSubmitting ? 0.6 : 1 }}
              >
                {isSubmitting ? "Creating…" : "Create account"}
              </button>
            </form>
          </div>

          <p className="mt-5" style={{ fontSize: 17, color: "var(--color-graphite)" }}>
            Already have one? <Link href="/login" style={{ color: "var(--color-link-blue)" }}>Sign in</Link>
          </p>
        </section>
      </main>
    </div>
  );
}
