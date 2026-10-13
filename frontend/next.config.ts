import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  /* Turbopack has built-in CSS support; do not add a "*.css" loader rule —
     it hijacks [next]/internal/font/google CSS and breaks next/font/google
     ("queries have exactly one entry"). Tailwind v4 works via `@import "tailwindcss"`. */
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
