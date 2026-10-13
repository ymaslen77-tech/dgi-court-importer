import { fileURLToPath } from 'node:url';

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  turbopack: {
    // The archived Webflow content is outside apps/web.
    root: fileURLToPath(new URL('../../', import.meta.url)),
  },
};

export default nextConfig;
