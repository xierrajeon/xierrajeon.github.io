import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // GitHub Pages is static hosting: no Node server, no Image Optimization API.
  output: "export",
  images: { unoptimized: true },
  // Emit `/portfolio/index.html` instead of `/portfolio.html` so Pages serves
  // clean URLs without redirects.
  trailingSlash: true,
  productionBrowserSourceMaps: false,
};

export default nextConfig;
