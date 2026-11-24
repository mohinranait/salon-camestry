import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["mongoose", "sharp"],
  images: {
    // Media lives in Cloudinary, which resizes and converts images at its CDN.
    loader: "custom",
    loaderFile: "./src/lib/image-loader.ts",
  },
  async redirects() {
    return [
      { source: '/login', destination: '/admin/login', permanent: false },
      { source: '/admin/signin', destination: '/admin/login', permanent: false },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
