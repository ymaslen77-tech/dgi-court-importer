import type { NextConfig } from "next";

// Protect every staging response, including APIs, even when a bot ignores robots.txt.
const releaseApproved = (() => {
  try {
    const origin = new URL(process.env.SITE_URL || "");
    const host = origin.hostname.toLowerCase();
    return process.env.SITE_CUTOVER === "true" &&
      process.env.SITE_RELEASE_APPROVED === "yes" &&
      origin.protocol === "https:" && !origin.username && !origin.password &&
      !origin.port && origin.pathname === "/" && !origin.search && !origin.hash &&
      host !== "localhost" && host !== "127.0.0.1" &&
      !host.endsWith(".webflow.io") && !host.endsWith(".webflow.com");
  } catch { return false; }
})();

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  output: "standalone",
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
        ...(!releaseApproved ? [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" }] : []),
      ],
    }];
  },
};

export default nextConfig;
