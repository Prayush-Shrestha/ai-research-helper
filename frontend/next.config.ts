import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  /* Turbopack has built-in CSS support; do not add a "*.css" loader rule —
     it hijacks [next]/internal/font/google CSS and breaks next/font/google
     ("queries have exactly one entry"). Tailwind v4 works via `@import "tailwindcss"`. */
  turbopack: {
    root: path.join(__dirname),
  },
  // Standalone output for Docker: produces a self-contained .next/standalone
  // directory that can run with `node server.js` without a full node_modules.
  output: "standalone",
};

export default nextConfig;
