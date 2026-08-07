import type { Metadata, Viewport } from "next";
import "./globals.css";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const siteOrigin = process.env.NEXT_PUBLIC_SITE_ORIGIN ?? "http://localhost:3000";
const canonicalUrl = `${siteOrigin}${basePath}/`;
const socialImageUrl = `${siteOrigin}${basePath}/og.png`;

export const metadata: Metadata = {
  metadataBase: new URL(canonicalUrl),
  title: {
    default: "Bloom & Move",
    template: "%s · Bloom & Move",
  },
  description:
    "A cute, simple, beginner-friendly weekly workout plan with an easy calendar view.",
  applicationName: "Bloom & Move",
  manifest: `${basePath}/manifest.webmanifest`,
  icons: {
    icon: `${basePath}/icon-192.png`,
    apple: `${basePath}/apple-touch-icon.png`,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Bloom & Move",
  },
  openGraph: {
    type: "website",
    url: canonicalUrl,
    title: "Bloom & Move",
    description: "A gentle weekly workout plan—one day at a time.",
    siteName: "Bloom & Move",
    images: [
      {
        url: socialImageUrl,
        width: 1731,
        height: 909,
        alt: "Bloom & Move workout calendar",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Bloom & Move",
    description: "A gentle weekly workout plan—one day at a time.",
    images: [socialImageUrl],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#fff8f2",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
