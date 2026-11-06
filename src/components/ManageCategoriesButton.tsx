"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CategoryManager } from "./CategoryManager";
import { useCategories } from "./useCategories";

// A "Manage categories" button that opens the add/remove dialog. `onChanged` runs after every change
// so the page behind it can refresh its own list or galleries.
export function ManageCategoriesButton({
  onChanged,
  className,
  label = "Manage categories",
}: {
  onChanged?: () => void;
  className?: string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        className={
          className ??
          "inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-dashed border-zinc-300 px-2.5 py-0.5 text-xs font-medium text-zinc-600 transition hover:border-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"
        }
      >
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true">
          <path d="M12 5v14M5 12h14" />
        </svg>
        {label}
      </button>

      <AnimatePresence>
        {open && (
          <CategoriesDialog
            onClose={() => {
              setOpen(false);
              requestAnimationFrame(() => triggerRef.current?.focus());
            }}
            onChanged={onChanged}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function CategoriesDialog({ onClose, onChanged }: { onClose: () => void; onChanged?: () => void }) {
  const { categories, loaded, reload } = useCategories();
  const reduce = useReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);

  // The parent passes a fresh onClose every render; keeping it in a ref stops the effect below
  // from re-running (and stealing focus from the input) each time.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    panelRef.current?.querySelector<HTMLInputElement>("#new-category")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.12 } }}
      transition={{ duration: 0.18 }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="categories-title"
        className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
        initial={reduce ? false : { opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={reduce ? { opacity: 0 } : { opacity: 0, y: 8, transition: { duration: 0.12 } }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 id="categories-title" className="text-lg font-semibold text-zinc-900">
              Manage categories
            </h2>
            <p className="mt-0.5 text-sm text-zinc-500">Categories group your galleries and the sections of your public portfolio.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-2 -mt-1 flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>

        <CategoryManager
          categories={categories}
          loaded={loaded}
          onChanged={() => {
            reload();
            onChanged?.();
          }}
        />

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700"
          >
            Done
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
