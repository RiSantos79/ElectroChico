"use client";

import dynamic from "next/dynamic";

// O Leaflet acede a `window` na importação — tem de ficar fora do SSR.
// `ssr: false` só é permitido dentro de um Client Component, daí este
// ficheiro extra em vez de usar `dynamic()` diretamente na página do admin.
const CitiesMap = dynamic(() => import("./cities-map"), {
  ssr: false,
  loading: () => (
    <div className="mx-auto flex items-center justify-center text-sm text-muted" style={{ height: 560, width: 340 }}>
      A carregar mapa…
    </div>
  ),
});

export function CitiesMapLoader(props: { cities: { city: string; orderCount: number; total: number }[] }) {
  return <CitiesMap {...props} />;
}
