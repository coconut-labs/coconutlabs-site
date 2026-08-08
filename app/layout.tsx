import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/react";
import { WatercolorWash } from "@/components/canvas/WatercolorWash";
import { FirstLoadReveal } from "@/components/shell/FirstLoadReveal";
import { Footer } from "@/components/shell/Footer";
import { Header } from "@/components/shell/Header";
import { PageNumber } from "@/components/shell/PageNumber";
import { RouteTransition } from "@/components/shell/RouteTransition";
import { buildMetadata } from "@/lib/seo";
import { fraunces, geistMono, geistSans, instrumentSerif } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://coconutlabs.org"),
  ...buildMetadata({
    title: "Coconut Labs",
    description: "An independent inference research lab building schedulers, systems notes, and careful measurements.",
  }),
  icons: {
    icon: "/favicon.svg",
  },
};

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#ECE6D6",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} ${fraunces.variable}`}
      lang="en"
    >
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <div className="page-shell paper-texture">
          <WatercolorWash
            className="wash-ambient"
            color="#9b6b1f"
            opacity={0.4}
            seed={3}
            style={{ top: "-14vh", right: "-16vw", width: "min(58vw, 760px)" }}
          />
          <WatercolorWash
            className="wash-ambient"
            color="#4a5b49"
            opacity={0.35}
            seed={12}
            style={{ bottom: "-18vh", left: "-18vw", width: "min(52vw, 680px)" }}
          />
          <Header />
          <RouteTransition>
            <main id="main">{children}</main>
          </RouteTransition>
          <Footer />
          <PageNumber />
          <FirstLoadReveal />
          <Analytics />
        </div>
      </body>
    </html>
  );
}
