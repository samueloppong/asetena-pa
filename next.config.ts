import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow opening the dev server from the PC's LAN IP on phones
  allowedDevOrigins: ["192.168.1.244", "10.10.100.10"],
  images: {
    // MinIO runs on localhost in Docker — allow image optimizer to fetch it
    dangerouslyAllowLocalIP: true,
    localPatterns: [
      {
        pathname: "/api/v1/media/**",
      },
      {
        pathname: "/adinkra_symbol.jfif",
      },
      {
        pathname: "/logo.jfif",
      },
      {
        pathname: "/brand/**",
      },
      {
        pathname: "/**",
      },
    ],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "9000",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "9000",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "minio",
        port: "9000",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
