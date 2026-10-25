import type { Metadata, Viewport } from "next";
import { Playfair_Display, Space_Grotesk } from "next/font/google";
import { Toaster } from "sonner";
import { PlayerProvider } from "@/providers/player-provider";
import { AppShell } from "@/components/app-shell";
import { PlayerBar } from "@/components/player/player-bar";
import { ServiceWorkerRegister } from "@/components/service-worker-register";
import { OfflineBanner } from "@/components/offline-banner";
import { APP_NAME, APP_DESCRIPTION } from "@/lib/constants";
import { SITE_URL } from "@/lib/site";
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
  metadataBase: new URL(SITE_URL),
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
    url: SITE_URL,
    siteName: APP_NAME,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${APP_NAME} — Free Music Streaming`,
    description: APP_DESCRIPTION,
    images: [`${SITE_URL}/opengraph-image.png`],
  },
  // Icons come from the file conventions in this folder:
  // favicon.ico, icon.png and apple-icon.png.
};

export const viewport: Viewport = {
  themeColor: "#0d0c0b",
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
          <OfflineBanner />
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
