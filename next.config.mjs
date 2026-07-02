/**
 * Static export configuration for GitHub Pages.
 *
 * GitHub Pages serves static files only, so we use Next's static export
 * (`output: "export"`), which emits a fully static site into `out/`.
 * Everything in this app fetches data client-side, so nothing needs a server.
 *
 * basePath / assetPrefix:
 *   Project Pages are served from https://<user>.github.io/<repo>/, so assets
 *   and links must be prefixed with "/<repo>". Set NEXT_PUBLIC_BASE_PATH to
 *   "/<repo>" (the deploy workflow does this automatically). Leave it empty for
 *   a user/organization page or a custom domain served from the root.
 */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "export",
  // GitHub Pages can't rewrite extensionless URLs, so emit `path/index.html`.
  trailingSlash: true,
  basePath,
  assetPrefix: basePath || undefined,
  images: { unoptimized: true },
};

export default nextConfig;
