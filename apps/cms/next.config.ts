import type { NextConfig } from "next";
import { withPayload } from "@payloadcms/next/withPayload";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  output: "standalone",
  // The CMS is a separate deployment and must never inherit SITE_CUTOVER.
};
export default withPayload(nextConfig);
