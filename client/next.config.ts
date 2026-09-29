import type { NextConfig } from "next";

const BACKEND_URL =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${BACKEND_URL}/api/:path*`,
      },
      {
        source: "/uploads/:path*",
        destination: `${BACKEND_URL}/uploads/:path*`,
      },
      {
        source: "/:file(.*\\.html)",
        destination: "http://localhost:5000/:file",
      },
      {
        source: "/css/:path*",
        destination: "http://localhost:5000/css/:path*",
      },
      {
        source: "/js/:path*",
        destination: "http://localhost:5000/js/:path*",
      },
    ];
  },
};

export default nextConfig;
