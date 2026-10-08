import type { Metadata, Viewport } from "next";
import { Playfair_Display, Space_Grotesk } from "next/font/google";
import { Toaster } from "sonner";
import { PlayerProvider } from "@/providers/player-provider";
import { AppShell } from "@/components/app-shell";
import { PlayerBar } from "@/components/player/player-bar";
import { ServiceWorkerRegister } from "@/components/service-worker-register";
import { APP_NAME, APP_DESCRIPTION } from "@/lib/constants";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-playfair",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-space-grotesk",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3001"),
  title: {
    default: `${APP_NAME} — Free Music Streaming`,
    template: `%s · ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  keywords: [
    "free music streaming",
    "online music",
    "hindi songs",
    "punjabi songs",
    "bollywood",
    "jiosaavn",
    "mp3 download",
    "aevon music",
  ],
  openGraph: {
    title: `${APP_NAME} — Free Music Streaming`,
    description: APP_DESCRIPTION,
    type: "website",
    siteName: APP_NAME,
  },
  twitter: {
    card: "summary_large_image",
    title: `${APP_NAME} — Free Music Streaming`,
    description: APP_DESCRIPTION,
  },
  icons: {
    icon: "/logo.png",
    apple: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#100f0d",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`dark ${playfair.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <PlayerProvider>
          <AppShell>{children}</AppShell>
          <PlayerBar />
          <Toaster
            position="bottom-center"
            theme="dark"
            toastOptions={{
              style: {
                background: "#1b1917",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#faf9f6",
              },
            }}
          />
          <ServiceWorkerRegister />
        </PlayerProvider>
        <div className="film-grain" aria-hidden="true" />
      </body>
    </html>
  );
}
