import type { NextConfig } from "next";

// Indexability X-Robots-Tag is set from the *runtime* release state in
// src/proxy.ts, never from build-time environment flags.

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  output: "standalone",
  // The apex domain is canonical; redirect www without changing DNS/MX.
  async redirects() {
    return [{
      source: "/:path*",
      has: [{ type: "host" as const, value: "www.dgi-pravo.ru" }],
      destination: "https://dgi-pravo.ru/:path*",
      permanent: true,
    }];
  },
  async headers() {
    // Shared baseline for preview and public pages. CSP needs measured
    // Next.js nonce and media integrations before it can be enforced.
    return [{
      source: "/:path*",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      ],
    }];
  },
};

export default nextConfig;
