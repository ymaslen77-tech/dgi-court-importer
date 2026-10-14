import { NextRequest, NextResponse } from "next/server";
import { searchCourtMetadata } from "@/data/court-search";

export const dynamic="force-dynamic";
export async function GET(request:NextRequest) {
  if (process.env.COURT_DB_READS!=="true") {
    return NextResponse.json({error:"Court database search is disabled"},{status:503,headers:{"Cache-Control":"no-store"}});
  }
  try {
    const url=new URL(request.url);
    const result=await searchCourtMetadata(url.searchParams.get("q"),url.searchParams.get("cursor"));
    return NextResponse.json(result,{headers:{"Cache-Control":"no-store","X-Robots-Tag":"noindex, nofollow"}});
  } catch(error) {
    if (error instanceof RangeError)
      return NextResponse.json({error:error.message},{status:400,headers:{"Cache-Control":"no-store"}});
    console.error("court search failed");
    return NextResponse.json({error:"Search temporarily unavailable"},{status:503,headers:{"Cache-Control":"no-store"}});
  }
}
