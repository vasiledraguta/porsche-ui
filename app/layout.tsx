import type { Metadata, Viewport } from "next";
import { Archivo } from "next/font/google";
import "./globals.css";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

const siteUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : `http://localhost:${process.env.PORT ?? 3000}`;

const title = "Porsche UI";
const description =
  "A single-screen web study of the Porsche PCM with a 3D 911 GT3 RS.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description:
    "Porsche UI is a single-screen web study of the Porsche PCM with a 3D 911 GT3 RS: live navigation, vehicle, media and climate.",
  openGraph: {
    type: "website",
    title,
    description,
    siteName: title,
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
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
