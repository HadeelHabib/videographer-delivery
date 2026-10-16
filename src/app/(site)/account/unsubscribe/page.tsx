"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api, ApiError } from "@/lib/api-client";

export default function UnsubscribePage() {
  return (
    <Suspense>
      <Unsubscribe />
    </Suspense>
  );
}

function Unsubscribe() {
  const token = useSearchParams().get("token") ?? "";
  const [state, setState] = useState<"working" | "ok" | "failed">(token ? "working" : "failed");
  const [message, setMessage] = useState("This unsubscribe link is invalid");
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (!token) return;
    api
      .post("/api/account/unsubscribe", { token })
      .then(() => setState("ok"))
      .catch((err) => {
        setState("failed");
        setMessage(err instanceof ApiError ? err.message : "Something went wrong");
      });
  }, [token]);

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center px-6 py-16">
      <h1 className="text-2xl text-zinc-900" style={{ fontFamily: "var(--font-display)" }}>
        {state === "working" ? "Unsubscribing..." : state === "ok" ? "You're unsubscribed" : "Couldn't unsubscribe"}
      </h1>
      <p className="mt-1 text-sm text-zinc-500">
        {state === "ok"
          ? "You won't get emails about new work any more. You'll still get account emails like password resets and replies to your comments."
          : state === "failed"
            ? message
            : "One moment."}
      </p>
    </div>
  );
}
