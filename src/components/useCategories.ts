"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api-client";

export type CategoryItem = { id: number; name: string; galleryCount: number };

// The studio's category list. `reload()` refetches (call it after anything that may have changed the list).
export function useCategories() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    api
      .get<{ categories: CategoryItem[] }>("/api/categories")
      .then((data) => {
        if (!cancelled) setCategories(data.categories);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [version]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);
  return { categories, names: categories.map((c) => c.name), loaded, reload };
}
