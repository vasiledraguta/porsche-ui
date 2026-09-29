import type { Metadata, Viewport } from "next";
import { Archivo } from "next/font/google";
import "./globals.css";

// Archivo is a close free stand-in for Porsche Next's squared grotesk.
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Porsche UI",
  description:
    "Porsche UI is a single-screen web study of the Porsche PCM with a 3D 911 GT3 RS: live navigation, vehicle, media and climate.",
};

export const viewport: Viewport = {
  themeColor: "#030304",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${archivo.variable} h-full`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
