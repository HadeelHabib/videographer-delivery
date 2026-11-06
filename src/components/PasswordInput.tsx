"use client";

import { useState, type ReactNode, type Ref } from "react";

type Props = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  invalid?: boolean; // red outline without a per-field message (the form shows one message for both fields)
  autoComplete?: "current-password" | "new-password";
  disabled?: boolean;
  inputRef?: Ref<HTMLInputElement>;
  labelAction?: ReactNode; // e.g. a "Forgot password?" link next to the label
};

const ICON = { fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round" } as const;

export function PasswordInput({
  id,
  label,
  value,
  onChange,
  onBlur,
  error,
  invalid,
  autoComplete = "current-password",
  disabled,
  inputRef,
  labelAction,
}: Props) {
  const [visible, setVisible] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const hasError = Boolean(error) || Boolean(invalid);

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium text-[#1d1c1a]">
          {label}
        </label>
        {labelAction}
      </div>

      <div className="relative">
        <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#8a867d]" {...ICON} aria-hidden="true">
          <rect x="4.5" y="10.5" width="15" height="9.5" rx="2.2" />
          <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
        </svg>

        <input
          ref={inputRef}
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          disabled={disabled}
          autoComplete={autoComplete}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          aria-invalid={hasError}
          aria-describedby={error ? `${id}-error` : capsLock ? `${id}-caps` : undefined}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => {
            setCapsLock(false);
            onBlur?.();
          }}
          onKeyUp={(e) => setCapsLock(e.getModifierState("CapsLock"))}
          onKeyDown={(e) => setCapsLock(e.getModifierState("CapsLock"))}
          className={`h-12 w-full rounded-xl border bg-white pl-11 pr-12 text-[15px] text-[#1d1c1a] outline-none transition placeholder:text-[#a5a198] disabled:opacity-60 ${
            hasError
              ? "border-[#b3261e] focus:ring-2 focus:ring-[#b3261e]/20"
              : "border-[#dcd8cf] hover:border-[#c4bfb3] focus:border-[#2f5d50] focus:ring-2 focus:ring-[#2f5d50]/20"
          }`}
        />

        <button
          type="button"
          // Keep focus in the field so the keyboard doesn't close on phones.
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setVisible((v) => !v)}
          disabled={disabled}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          className="absolute right-1 top-1/2 flex h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-lg text-[#6f6b63] transition hover:bg-[#f0eee9] hover:text-[#1d1c1a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f5d50]/40 disabled:opacity-60"
        >
          {visible ? (
            <svg viewBox="0 0 24 24" className="h-5 w-5" {...ICON} aria-hidden="true">
              <path d="M3 3l18 18" />
              <path d="M10.6 6.2A9.7 9.7 0 0 1 12 6c5 0 8.5 4.2 9.5 6-.4.8-1.2 1.9-2.3 3M6.6 7.6C4.7 8.9 3.4 10.7 2.5 12c1 1.8 4.5 6 9.5 6 1.5 0 2.8-.4 4-.9" />
              <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="h-5 w-5" {...ICON} aria-hidden="true">
              <path d="M2.5 12S6 6 12 6s9.5 6 9.5 6-3.5 6-9.5 6S2.5 12 2.5 12Z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </button>
      </div>

      <div className="min-h-[20px] pt-1.5 text-[13px] leading-snug">
        {error ? (
          <p id={`${id}-error`} className="flex items-start gap-1.5 text-[#b3261e]">
            <svg viewBox="0 0 24 24" className="mt-0.5 h-3.5 w-3.5 shrink-0" {...ICON} aria-hidden="true">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7.5v5.5M12 16.4v.1" />
            </svg>
            {error}
          </p>
        ) : capsLock ? (
          <p id={`${id}-caps`} className="flex items-center gap-1.5 text-[#8a5a00]">
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0" {...ICON} aria-hidden="true">
              <path d="M12 4 5 12h4v4h6v-4h4L12 4Z" />
              <path d="M9 20h6" />
            </svg>
            Caps Lock is on
          </p>
        ) : null}
      </div>
    </div>
  );
}
