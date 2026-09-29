import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:5000/api/:path*",
      },
      {
        source: "/uploads/:path*",
        destination: "http://localhost:5000/uploads/:path*",
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
