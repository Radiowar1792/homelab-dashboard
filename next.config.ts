import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Activation du mode strict React
  reactStrictMode: true,

  // Configuration des images distantes (ajouter les domaines selon les besoins)
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },

  // Headers de sécurité
  async headers() {
    return [
      // Service worker : no-cache pour forcer la mise à jour immédiate
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },

  // Redirection HTTP vers HTTPS en production
  async redirects() {
    return [];
  },

  // Variables d'env exposées côté client
  env: {
    NEXT_PUBLIC_APP_NAME:
      process.env["NEXT_PUBLIC_APP_NAME"] ?? "Homelab Dashboard",
    NEXT_PUBLIC_APP_URL:
      process.env["NEXT_PUBLIC_APP_URL"] ?? "http://localhost:3000",
  },
};

export default nextConfig;
