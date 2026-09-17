"use client";

import { useMemo, useState } from "react";
import { fuzzyMatch } from "./search";

export function useAdminSearch<T>(items: T[], getHaystack: (item: T) => string) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(
    () => (query.trim() ? items.filter((item) => fuzzyMatch(getHaystack(item), query)) : items),
    [items, query, getHaystack],
  );
  return { query, setQuery, filtered };
}
