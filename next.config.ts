import type { NextConfig } from "next";

const API_URL = process.env.API_URL ?? "http://localhost:3333";

// unsafe-inline em script/style: o next-themes injeta um pequeno script inline
// (evita o flash de tema) e o Tailwind/inline styles usam estilo inline pontual.
// Ainda bloqueia a maior parte dos vetores de XSS (scripts de origens externas,
// framing, etc.) — passar para nonces se algum dia isso for removido.
const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: ${API_URL} https://res.cloudinary.com`,
  `connect-src 'self' ${API_URL}`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
