"use client";

import "leaflet/dist/leaflet.css";
import { CircleMarker, MapContainer, TileLayer, Tooltip as LeafletTooltip } from "react-leaflet";
import { coordsForCity } from "@/lib/pt-cities";
import { formatPrice } from "@/lib/format";

type CityDatum = { city: string; orderCount: number; total: number };

// Portugal continental é muito mais alto do que largo — um mapa largo e
// baixo desperdiça espaço e esmaga o país. Este container é estreito e
// alto de propósito, e os bounds fixam a vista ao continente (a Madeira e
// os Açores ficam fora do enquadramento).
const MAINLAND_BOUNDS: [[number, number], [number, number]] = [
  [36.8, -9.6],
  [42.2, -6.1],
];

export default function CitiesMap({ cities }: { cities: CityDatum[] }) {
  const located = cities
    .map((c) => ({ ...c, coords: coordsForCity(c.city) }))
    .filter((c): c is CityDatum & { coords: [number, number] } => c.coords !== null);

  const maxOrders = Math.max(...located.map((c) => c.orderCount), 1);

  return (
    <div className="mx-auto" style={{ width: 340 }}>
      <MapContainer
        bounds={MAINLAND_BOUNDS}
        scrollWheelZoom={false}
        style={{ height: 560, width: "100%", borderRadius: 12 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {located.map((c) => (
          <CircleMarker
            key={c.city}
            center={c.coords}
            radius={6 + (c.orderCount / maxOrders) * 18}
            pathOptions={{ color: "#2563eb", fillColor: "#2563eb", fillOpacity: 0.5 }}
          >
            <LeafletTooltip>
              {c.city} — {c.orderCount} encomenda{c.orderCount !== 1 ? "s" : ""} ({formatPrice(c.total)})
            </LeafletTooltip>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
