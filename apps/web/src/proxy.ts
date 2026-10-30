import { NextResponse, type NextRequest } from "next/server";

/**
 * Use runtime environment for crawler response headers. next.config.ts headers
 * are fixed at build time and can accidentally keep a legitimate Coolify
 * release under a permanent X-Robots-Tag: noindex after deployment.
 *
 * This is a *site release* check, never permission to publish unpublished
 * CMS content, legal drafts, court data, or admin/API routes. Those remain
 * controlled by their existing route-level publication rules.
 */
function productionSeoRelease(): boolean {
  try {
    const siteUrl = new URL(process.env.SITE_URL || "");
    const host = siteUrl.hostname.toLowerCase();
    const allowedHost = host === "dgi-pravo.ru" ||
      (process.env.CI === "true" &&
        process.env.DATABASE_URL?.includes("housing_ci") === true &&
        host === "example.org");
    return process.env.SITE_CUTOVER === "true" &&
      process.env.SITE_RELEASE_APPROVED === "yes" &&
      siteUrl.protocol === "https:" &&
      !siteUrl.username && !siteUrl.password && !siteUrl.port &&
      siteUrl.pathname === "/" && !siteUrl.search && !siteUrl.hash &&
      allowedHost;
  } catch {
    return false;
  }
}

export function proxy(_request: NextRequest) {
  const response = NextResponse.next();
  if (!productionSeoRelease()) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  }
  return response;
}

// Include APIs and static files so previews cannot accidentally expose them
// to indexing; production's per-page metadata and robots.txt remain in force.
export const config = {
  matcher: "/:path*",
};
