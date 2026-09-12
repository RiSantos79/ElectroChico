"use client";

import { useState, type MouseEvent } from "react";
import { ProductMedia } from "@/components/product-media";

export function ProductGallery({ images, color, name }: { images: string[]; color: string; name: string }) {
  const [active, setActive] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [zoomOrigin, setZoomOrigin] = useState("50% 50%");
  const activeImage = images[active];

  function handleZoomMove(e: MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomOrigin(`${x}% ${y}%`);
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => activeImage && setLightboxOpen(true)}
        disabled={!activeImage}
        className={`mx-auto block w-full max-w-xs ${activeImage ? "cursor-zoom-in" : "cursor-default"}`}
        aria-label="Ampliar imagem"
      >
        <ProductMedia color={color} name={name} image={activeImage} className="aspect-square w-full" />
      </button>

      {images.length > 1 && (
        <div className="mx-auto mt-3 grid max-w-xs grid-cols-5 gap-2">
          {images.map((image, i) => (
            <button
              key={image}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Imagem ${i + 1}`}
              className={`aspect-square overflow-hidden rounded-lg border ${
                i === active ? "border-accent" : "border-border"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {lightboxOpen && activeImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            aria-label="Fechar"
            className="absolute right-4 top-4 text-3xl text-white/80 hover:text-white"
          >
            ✕
          </button>
          <div
            className="max-h-[90vh] max-w-[90vw] overflow-hidden rounded-lg"
            onClick={(e) => e.stopPropagation()}
            onMouseMove={handleZoomMove}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={activeImage}
              alt={name}
              className="max-h-[90vh] max-w-[90vw] cursor-zoom-in object-contain transition-transform duration-150 ease-out hover:scale-[2]"
              style={{ transformOrigin: zoomOrigin }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
