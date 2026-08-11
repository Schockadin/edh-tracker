import type { Metadata, Viewport } from "next";

import { ServiceWorkerRegister } from "@/components/service-worker-register";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "EDH Tracker",
    template: "%s · EDH Tracker",
  },
  description: "Persönlicher EDH / Commander Deck- und Spiel-Tracker.",
  applicationName: "EDH Tracker",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "EDH Tracker",
  },
  formatDetection: { telephone: false },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#1e1b4b",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de">
      <body>
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
