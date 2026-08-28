import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Control de pagos",
  description: "App interna de control de pagos y comprobantes"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
