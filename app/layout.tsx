import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/react";
import { FieldGround } from "@/components/shell/FieldGround";
import { FirstLoadReveal } from "@/components/shell/FirstLoadReveal";
import { Footer } from "@/components/shell/Footer";
import { Header } from "@/components/shell/Header";
import { PageNumber } from "@/components/shell/PageNumber";
import { RouteTransition } from "@/components/shell/RouteTransition";
import { buildMetadata } from "@/lib/seo";
import { geistMono, geistSans } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://coconutlabs.org"),
  ...buildMetadata({
    title: "Coconut Labs",
    description: "An independent inference research lab: schedulers, measured results, and the benches behind them.",
  }),
  icons: {
    icon: "/favicon.svg",
  },
};

/* colorScheme was pinned "light" and themeColor was the retired warm paper
   #ECE6D6, the viewport meta was fighting the token layer's dark scheme and
   painting old-brand chrome on mobile. Both now follow the scheme. */
export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F7F7F5" },
    { media: "(prefers-color-scheme: dark)", color: "#0C0C0E" },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      className={`${geistSans.variable} ${geistMono.variable}`}
      lang="en"
      suppressHydrationWarning
    >
      <body>
        {/* No-flash theme replay. Parser-blocking and first in the document
            body, so a stored explicit theme lands on <html> before anything
            paints. App Router owns <head>, and React does not hoist inline
            scripts, so first-in-body is the earliest slot we control; it
            runs before first paint of any content below it. Kept tiny and
            try/wrapped: storage can be unavailable (private mode). */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              '(function(){try{var t=localStorage.getItem("theme");if(t==="light"||t==="dark"){document.documentElement.setAttribute("data-theme",t)}}catch(e){}})();',
          }}
        />
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <div className="page-shell paper-texture">
          <FieldGround />
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
