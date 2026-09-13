"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Regista uma visita anónima por navegação (sem cookies, sem IP) — só para
// os gráficos de horas/dias de maior atividade no dashboard.
export function PageViewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: pathname }),
      keepalive: true,
    }).catch(() => {});
  }, [pathname]);

  return null;
}
