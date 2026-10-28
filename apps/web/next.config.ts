import createMDX from "@next/mdx";
import type { NextConfig } from "next";

// Fully static site: `next build` writes plain HTML/CSS/JS to out/.
// Data comes from .generated/, produced by scripts/registry/build.ts.
const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

// Turbopack needs plugins referenced by name.
const withMDX = createMDX({
  options: { remarkPlugins: ["remark-gfm"] },
});

export default withMDX(nextConfig);
