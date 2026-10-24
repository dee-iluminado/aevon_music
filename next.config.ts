import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "c.saavncdn.com" },
      { protocol: "https", hostname: "aac.saavncdn.com" },
      { protocol: "https", hostname: "cdna.saavncdn.com" },
      { protocol: "https", hostname: "www.jiosaavn.com" },
    ],
  },
  async redirects() {
    return [
      {
        source: "/favicon.ico",
        destination: "/logo.png",
        permanent: false,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
      {
        source: "/logo.png",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
        ],
      },
    ];
  },
};

export default nextConfig;
