export function ProductMedia({
  color,
  name,
  image,
  className = "",
}: {
  color: string;
  name: string;
  image?: string;
  className?: string;
}) {
  if (image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={image}
        alt={name}
        loading="lazy"
        className={`rounded-xl border border-border bg-surface object-cover ${className}`}
      />
    );
  }

  return (
    <div
      className={`flex items-center justify-center rounded-xl border border-border bg-surface p-6 ${className}`}
    >
      <svg viewBox="0 0 64 64" className="h-16 w-16 opacity-80" style={{ color }}>
        <rect x="10" y="6" width="44" height="52" rx="6" fill="currentColor" opacity="0.15" />
        <rect x="10" y="6" width="44" height="52" rx="6" fill="none" stroke="currentColor" strokeWidth="2" />
        <circle cx="32" cy="32" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
      </svg>
      <span className="sr-only">{name}</span>
    </div>
  );
}
