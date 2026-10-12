"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Wordmark } from "@/components/layout/Logo";
import { useAuth } from "@/hooks/useAuth";
import { registerSchema, type RegisterInput } from "@/lib/schemas";

const field = {
  borderBottom: "1px solid #292B2D",
  color: "var(--color-primary-text)",
  borderRadius: 0,
} as const;

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="font-tech mt-2" style={{ color: "#ff9d9d", fontSize: 11 }}>
      {message.toUpperCase()}
    </p>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const { register: signUp } = useAuth();
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
      router.push("/dashboard");
    } catch (err) {
      setError("root", {
        message: err instanceof Error ? err.message : "Registration failed.",
      });
    }
  }

  return (
    <div className="page-enter min-h-screen" style={{ background: "var(--color-void)" }}>
      <header style={{ height: 72, borderBottom: "1px solid #292B2D" }}>
        <div className="mx-auto flex h-full items-center justify-between px-5 sm:px-8" style={{ maxWidth: "var(--page-width)" }}>
          <Link href="/"><Wordmark /></Link>
          <p className="font-tech" style={{ color: "var(--color-tertiary-text)", fontSize: 10 }}>ACCESS / REGISTER</p>
        </div>
      </header>
      <main className="mx-auto px-5 sm:px-8" style={{ maxWidth: 560 }}>
        <section className="pt-16 sm:pt-24">
          <p className="font-tech" style={{ color: "var(--color-tertiary-text)" }}>AUTH / 02</p>
          <h1 className="font-display mt-3" style={{ fontSize: 56, lineHeight: 1 }}>Open your laboratory.</h1>
          <p className="mt-3 text-[15px]" style={{ color: "var(--color-secondary-text)" }}>One archive. Every paper. Ready for intelligence.</p>
          <form onSubmit={handleSubmit(onSubmit)} className="mt-10 space-y-5" noValidate>
            <div>
              <label htmlFor="name" className="micro-label block" style={{ color: "var(--color-tertiary-text)" }}>FULL NAME</label>
              <input
                id="name" autoComplete="name"
                placeholder="Ada Lovelace"
                aria-invalid={Boolean(errors.name)}
                className="mt-2 w-full bg-transparent px-0 py-3 text-[16px] outline-none" style={field}
                {...register("name")}
              />
              <FieldError message={errors.name?.message} />
            </div>
            <div>
              <label htmlFor="email" className="micro-label block" style={{ color: "var(--color-tertiary-text)" }}>EMAIL</label>
              <input
                id="email" type="email" autoComplete="email"
                placeholder="you@university.edu"
                aria-invalid={Boolean(errors.email)}
                className="mt-2 w-full bg-transparent px-0 py-3 text-[16px] outline-none" style={field}
                {...register("email")}
              />
              <FieldError message={errors.email?.message} />
            </div>
            <div>
              <label htmlFor="password" className="micro-label block" style={{ color: "var(--color-tertiary-text)" }}>PASSWORD</label>
              <input
                id="password" type="password" autoComplete="new-password"
                placeholder="Minimum 6 characters"
                aria-invalid={Boolean(errors.password)}
                className="mt-2 w-full bg-transparent px-0 py-3 text-[16px] outline-none" style={field}
                {...register("password")}
              />
              <FieldError message={errors.password?.message} />
            </div>
            {errors.root && (
              <p role="alert" className="font-tech" style={{ color: "#ff9d9d", fontSize: 11 }}>
                {errors.root.message?.toUpperCase()}
              </p>
            )}
            <button type="submit" disabled={isSubmitting} className="font-tech w-full rounded-full py-4"
              style={{ background: "var(--color-primary-text)", color: "#050505", fontSize: 12, opacity: isSubmitting ? 0.6 : 1 }}>
              {isSubmitting ? "PROVISIONING…" : "CREATE WORKSPACE →"}
            </button>
          </form>
          <div className="mt-8 flex items-center justify-between" style={{ borderTop: "1px solid #292B2D", paddingTop: 20 }}>
            <p className="text-[13px]" style={{ color: "var(--color-secondary-text)" }}>
              Have access? <Link href="/login" style={{ color: "var(--color-primary-text)" }}>Sign in</Link>
            </p>
            <p className="font-tech" style={{ color: "var(--color-tertiary-text)", fontSize: 10 }}>POST /AUTH/REGISTER</p>
          </div>
        </section>
      </main>
    </div>
  );
}
