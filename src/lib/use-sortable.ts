"use client";

import { useMemo, useState } from "react";

// Ordenação client-side reutilizável para qualquer tabela do backoffice —
// cada página só precisa de indicar como extrair o valor de cada coluna.
export function useSortable<T>(data: T[], getValue: (item: T, key: string) => string | number) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [ascending, setAscending] = useState(true);

  const sorted = useMemo(() => {
    if (!sortKey) return data;
    return [...data].sort((a, b) => {
      const av = getValue(a, sortKey);
      const bv = getValue(b, sortKey);
      if (av < bv) return ascending ? -1 : 1;
      if (av > bv) return ascending ? 1 : -1;
      return 0;
    });
  }, [data, sortKey, ascending, getValue]);

  function toggleSort(key: string) {
    if (sortKey === key) setAscending((prev) => !prev);
    else {
      setSortKey(key);
      setAscending(true);
    }
  }

  return { sorted, sortKey, ascending, toggleSort };
}
