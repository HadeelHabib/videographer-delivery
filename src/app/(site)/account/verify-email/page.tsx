"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { api, ApiError } from "@/lib/api-client";

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmail />
    </Suspense>
  );
}

function VerifyEmail() {
  const token = useSearchParams().get("token") ?? "";
  const [state, setState] = useState<"working" | "ok" | "failed">(token ? "working" : "failed");
  const [message, setMessage] = useState("This confirmation link is invalid or has expired");
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (!token) return;
    api
      .post("/api/account/verify-email", { token })
      .then(() => setState("ok"))
      .catch((err) => {
        setState("failed");
        setMessage(err instanceof ApiError ? err.message : "Something went wrong");
      });
  }, [token]);

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center px-6 py-16">
      <h1 className="text-2xl text-zinc-900" style={{ fontFamily: "var(--font-display)" }}>
        {state === "working" ? "Confirming your email..." : state === "ok" ? "Email confirmed" : "Couldn't confirm"}
      </h1>
      {state === "ok" && (
        <>
          <p className="mt-1 text-sm text-zinc-500">Thanks! You can now leave comments on your galleries.</p>
          <Link href="/" className="mt-6 rounded-lg bg-zinc-900 px-4 py-2.5 text-center text-sm font-medium text-white hover:bg-zinc-700">
            Continue
          </Link>
        </>
      )}
      {state === "failed" && (
        <p className="mt-1 text-sm text-zinc-500">
          {message}. Sign in and open any gallery to request a new link.
        </p>
      )}
    </div>
  );
}
