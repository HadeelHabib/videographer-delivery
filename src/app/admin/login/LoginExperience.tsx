"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion, useAnimationControls, useReducedMotion } from "framer-motion";
import { api, ApiError } from "@/lib/api-client";
import { PasswordInput } from "@/components/PasswordInput";
import {
  adminRedirectTarget,
  loginFailureMessage,
  validateEmail,
  validateLogin,
  validatePassword,
  type LoginFieldErrors,
} from "@/lib/login-validation";
import { LoginBrandPanel, type Studio } from "./LoginBrandPanel";

const EASE = [0.22, 1, 0.36, 1] as const;

const ICON = { fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round" } as const;

export function LoginExperience({ studio }: { studio: Studio }) {
  const router = useRouter();
  const next = useSearchParams().get("next");
  const reduce = useReducedMotion();
  const shake = useAnimationControls();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<LoginFieldErrors>({});
  const [failure, setFailure] = useState<{ message: string; status: number | null } | null>(null);
  const [phase, setPhase] = useState<"idle" | "loading" | "success">("idle");

  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const busy = phase !== "idle";

  // Land in the email field on desktop; on phones that would pop the keyboard before they've read anything.
  useEffect(() => {
    if (!window.matchMedia("(pointer: coarse)").matches) emailRef.current?.focus();
  }, []);

  function reject() {
    if (!reduce) shake.start({ x: [0, -10, 8, -5, 2, 0], transition: { duration: 0.38, ease: "easeOut" } });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setFailure(null);

    const found = validateLogin(email, password);
    setErrors(found);
    if (found.email || found.password) {
      (found.email ? emailRef : passwordRef).current?.focus();
      reject();
      return;
    }

    setPhase("loading");
    try {
      await api.post("/api/auth/login", { email: email.trim(), password });
      setPhase("success");
      router.push(adminRedirectTarget(next));
      router.refresh();
    } catch (err) {
      const status = err instanceof ApiError ? err.status : null;
      setFailure({ message: loginFailureMessage(status), status });
      setPhase("idle");
      reject();
      if (status === 401) {
        setPassword("");
        // The field is still disabled until React re-renders, and a disabled input can't take focus.
        requestAnimationFrame(() => passwordRef.current?.focus());
      }
    }
  }

  const credentialsRejected = failure?.status === 401;
  const item = {
    hidden: reduce ? { opacity: 1 } : { opacity: 0, y: 14 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE } },
  };

  return (
    <div className="grid min-h-dvh flex-1 lg:grid-cols-[1.05fr_1fr]">
      <LoginBrandPanel studio={studio} />

      <main className="relative flex flex-col bg-[#fafaf8]">
        {/* Phones and tablets: a compact brand strip instead of the big panel */}
        <div className="flex items-center gap-3 border-b border-[#ece9e2] bg-[#12110f] px-6 py-4 text-white lg:hidden">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-base font-semibold ring-1 ring-white/15" style={{ fontFamily: "var(--font-display)" }}>
            {studio.name.trim().charAt(0).toUpperCase() || "S"}
          </span>
          <span className="text-sm font-medium tracking-wide">{studio.name.trim()}</span>
        </div>

        <div className="flex flex-1 items-center justify-center px-6 py-10 sm:px-10">
          <motion.div
            className="w-full max-w-[400px]"
            variants={{ show: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } }, hidden: {} }}
            initial="hidden"
            animate="show"
          >
            <motion.div variants={item}>
              <h1 className="text-[32px] leading-tight text-[#1d1c1a]" style={{ fontFamily: "var(--font-display)" }}>
                Welcome back
              </h1>
              <p className="mt-2 text-[15px] text-[#6f6b63]">
                {next ? "Sign in to continue to your dashboard." : "Sign in to manage your galleries and deliveries."}
              </p>
            </motion.div>

            <motion.div animate={shake} className="mt-8">
              <AnimatePresence initial={false}>
                {failure && (
                  <motion.div
                    key="failure"
                    role="alert"
                    initial={reduce ? false : { opacity: 0, y: -6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={reduce ? { opacity: 0 } : { opacity: 0, y: -4, transition: { duration: 0.15 } }}
                    transition={{ duration: 0.22, ease: EASE }}
                    className="mb-5 flex items-start gap-3 rounded-xl border border-[#b3261e]/25 bg-[#b3261e]/[0.06] px-4 py-3 text-sm text-[#8c1d17]"
                  >
                    <svg viewBox="0 0 24 24" className="mt-0.5 h-[18px] w-[18px] shrink-0 text-[#b3261e]" {...ICON} aria-hidden="true">
                      <path d="M12 3.5 21 19H3L12 3.5Z" />
                      <path d="M12 9.5v4.2M12 16.4v.1" />
                    </svg>
                    <div>
                      <p className="font-medium">{credentialsRejected ? "We couldn't sign you in" : "Sign-in didn't go through"}</p>
                      <p className="mt-0.5 leading-snug text-[#8c1d17]/90">{failure.message}</p>
                      {credentialsRejected && (
                        <Link href="/admin/forgot-password" className="mt-1.5 inline-block font-medium underline underline-offset-2 hover:text-[#b3261e]">
                          Reset your password
                        </Link>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={onSubmit} noValidate>
                <motion.div variants={item}>
                  <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-[#1d1c1a]">
                    Email
                  </label>
                  <div className="relative">
                    <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#8a867d]" {...ICON} aria-hidden="true">
                      <rect x="3.5" y="5.5" width="17" height="13" rx="2.4" />
                      <path d="m4.5 7.5 7.5 5.5 7.5-5.5" />
                    </svg>
                    <input
                      ref={emailRef}
                      id="email"
                      type="email"
                      inputMode="email"
                      autoComplete="username"
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                      value={email}
                      disabled={busy}
                      placeholder="you@yourstudio.com"
                      aria-invalid={Boolean(errors.email) || credentialsRejected}
                      aria-describedby={errors.email ? "email-error" : undefined}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (errors.email) setErrors((er) => ({ ...er, email: validateEmail(e.target.value) }));
                      }}
                      onBlur={() => email && setErrors((er) => ({ ...er, email: validateEmail(email) }))}
                      className={`h-12 w-full rounded-xl border bg-white pl-11 pr-3 text-[15px] text-[#1d1c1a] outline-none transition placeholder:text-[#a5a198] disabled:opacity-60 ${
                        errors.email || credentialsRejected
                          ? "border-[#b3261e] focus:ring-2 focus:ring-[#b3261e]/20"
                          : "border-[#dcd8cf] hover:border-[#c4bfb3] focus:border-[#2f5d50] focus:ring-2 focus:ring-[#2f5d50]/20"
                      }`}
                    />
                  </div>
                  <div className="min-h-[20px] pt-1.5 text-[13px] leading-snug">
                    {errors.email && (
                      <p id="email-error" className="flex items-start gap-1.5 text-[#b3261e]">
                        <svg viewBox="0 0 24 24" className="mt-0.5 h-3.5 w-3.5 shrink-0" {...ICON} aria-hidden="true">
                          <circle cx="12" cy="12" r="9" />
                          <path d="M12 7.5v5.5M12 16.4v.1" />
                        </svg>
                        {errors.email}
                      </p>
                    )}
                  </div>
                </motion.div>

                <motion.div variants={item}>
                  <PasswordInput
                    id="password"
                    label="Password"
                    value={password}
                    inputRef={passwordRef}
                    disabled={busy}
                    error={errors.password}
                    invalid={credentialsRejected}
                    onChange={(v) => {
                      setPassword(v);
                      if (errors.password) setErrors((er) => ({ ...er, password: validatePassword(v) }));
                    }}
                    onBlur={() => password === "" || setErrors((er) => ({ ...er, password: validatePassword(password) }))}
                    labelAction={
                      <Link href="/admin/forgot-password" className="text-[13px] font-medium text-[#2f5d50] underline-offset-2 hover:underline">
                        Forgot password?
                      </Link>
                    }
                  />
                </motion.div>

                <motion.div variants={item} className="mt-3">
                  <motion.button
                    type="submit"
                    disabled={busy}
                    whileTap={reduce || busy ? undefined : { scale: 0.98 }}
                    className="relative flex h-12 w-full cursor-pointer items-center justify-center gap-2.5 overflow-hidden rounded-xl bg-[#2f5d50] text-[15px] font-medium text-white shadow-[0_1px_2px_rgba(0,0,0,0.12),0_8px_20px_-8px_rgba(47,93,80,0.55)] transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f5d50]/50 focus-visible:ring-offset-2 disabled:cursor-default disabled:hover:brightness-100"
                  >
                    <AnimatePresence mode="wait" initial={false}>
                      {phase === "idle" && (
                        <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.1 } }} className="flex items-center gap-2">
                          Sign in
                          <svg viewBox="0 0 24 24" className="h-4 w-4" {...ICON} strokeWidth={2} aria-hidden="true">
                            <path d="M5 12h14M13 6l6 6-6 6" />
                          </svg>
                        </motion.span>
                      )}
                      {phase === "loading" && (
                        <motion.span key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.1 } }} className="flex items-center gap-2.5">
                          <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] animate-spin" fill="none" aria-hidden="true">
                            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity={0.3} strokeWidth={3} />
                            <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth={3} strokeLinecap="round" />
                          </svg>
                          Signing in…
                        </motion.span>
                      )}
                      {phase === "success" && (
                        <motion.span key="success" initial={reduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2">
                          <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" {...ICON} strokeWidth={2.2} aria-hidden="true">
                            <path d="m5 12.5 4.5 4.5L19 7.5" />
                          </svg>
                          Welcome back
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.button>
                </motion.div>
              </form>
            </motion.div>

            <motion.p variants={item} className="mt-8 text-center text-[13px] text-[#8a867d]">
              Studio staff only ·{" "}
              <Link href="/" className="font-medium text-[#6f6b63] underline-offset-2 hover:text-[#1d1c1a] hover:underline">
                Back to website
              </Link>
            </motion.p>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
