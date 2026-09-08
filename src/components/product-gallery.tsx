"use client";

import { useState } from "react";
import { ProductMedia } from "@/components/product-media";

export function ProductGallery({ images, color, name }: { images: string[]; color: string; name: string }) {
  const [active, setActive] = useState(0);

  return (
    <div>
      <ProductMedia color={color} name={name} image={images[active]} className="aspect-square w-full" />
      {images.length > 1 && (
        <div className="mt-3 grid grid-cols-5 gap-2">
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
    </div>
  );
}
