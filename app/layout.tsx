import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Torneo Interno 2026 — UTN Santa Fe",
  description:
    "Posiciones, fixture y playoffs del Torneo Interno 2026 de la UTN Facultad Regional Santa Fe.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
