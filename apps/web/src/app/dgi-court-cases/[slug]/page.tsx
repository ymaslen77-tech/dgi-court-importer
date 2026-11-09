import type { Metadata } from "next";
import { redirect } from "next/navigation";

// Withdraw unverified archival case pages from public access.
// Old bookmarks lead back to the verified-only catalogue, never to a case claim.
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function RetiredUnverifiedCourtPage() {
  redirect("/sudebnaya-praktika-dgi");
}
