"use client";

import "leaflet/dist/leaflet.css";
import { CircleMarker, MapContainer, TileLayer, Tooltip as LeafletTooltip } from "react-leaflet";
import { coordsForCity } from "@/lib/pt-cities";
import { formatPrice } from "@/lib/format";

type CityDatum = { city: string; orderCount: number; total: number };

export default function CitiesMap({ cities }: { cities: CityDatum[] }) {
  const located = cities
    .map((c) => ({ ...c, coords: coordsForCity(c.city) }))
    .filter((c): c is CityDatum & { coords: [number, number] } => c.coords !== null);

  const maxOrders = Math.max(...located.map((c) => c.orderCount), 1);

  return (
    <MapContainer
      center={[39.6, -8.5]}
      zoom={6}
      scrollWheelZoom={false}
      style={{ height: 320, width: "100%", borderRadius: 12 }}
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
  );
}
