import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { readVerifiedCourtPdf } from "@/data/verified-courts";

export const dynamic = "force-dynamic";
type Params = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { slug } = await params;
  try {
    const pdf = await readVerifiedCourtPdf(slug);
    if (!pdf) return new NextResponse("Документ не найден", { status: 404 });
    const bytes = pdf.bytes;
    // The original PDF is served byte-for-byte; no synthetic court
    // decision is generated or represented as an original.
    const checksum = createHash("sha256").update(bytes).digest("hex");
    if (bytes.length < 300 || bytes.length > 15728640 ||
      bytes.subarray(0, 5).toString("ascii") !== "%PDF-" ||
      checksum !== pdf.sha256) {
      console.error("Verified court PDF integrity check failed", slug);
      return new NextResponse("Документ не прошёл проверку целостности", { status: 503 });
    }
    return new NextResponse(new Uint8Array(bytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="court-act-${slug}.pdf"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'; sandbox",
        "X-Robots-Tag": "noindex, nofollow",
      },
    });
  } catch (e) {
    console.error("Verified PDF read error", e instanceof Error ? e.name : "unknown");
    return new NextResponse("PDF временно недоступен", { status: 503 });
  }
}
