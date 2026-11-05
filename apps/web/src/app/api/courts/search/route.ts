import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Old metadata-only endpoint is retired. Returning candidate records here
// would bypass the verified-publication rule in the new court catalogue.
export function GET() {
  return NextResponse.json({ error: "Используйте поиск проверенных судебных актов", path: "/api/courts/verified" }, {
    status: 410,
    headers: {
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
