import { NextRequest, NextResponse } from "next/server";
import { searchVerifiedCourtActs, validVerifiedSearch } from "@/data/verified-courts";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const q = validVerifiedSearch(request.nextUrl.searchParams.get("q") ?? "");
    const items = await searchVerifiedCourtActs(q);
    return NextResponse.json({ items }, {
      headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
    });
  } catch (err) {
    if (err instanceof RangeError) return NextResponse.json(
      { error: "Некорректный поисковый запрос" }, { status: 400 }
    );
    console.error("Verified court search error", err instanceof Error ? err.name : "unknown");
    return NextResponse.json({ error: "Поиск временно недоступен" }, { status: 503 });
  }
}
