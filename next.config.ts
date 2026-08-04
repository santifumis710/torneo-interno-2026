import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // sharp usa binarios nativos: que no lo empaquete el bundler del servidor.
  serverExternalPackages: ["sharp"],
  experimental: {
    // Permite subir logos de hasta ~8 MB desde el panel de administración.
    serverActions: { bodySizeLimit: "8mb" },
  },
};

export default nextConfig;
