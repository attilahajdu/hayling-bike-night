import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Barlow_Condensed, Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

const GA_MEASUREMENT_ID = "G-FLCGBZTFFK";

// Condensed display: load heavy masters so headings read sharp, not soft (400/600 alone feel “lifestyle” at mid sizes)
const display = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800", "900"],
  variable: "--font-display",
});
const body = Inter({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-body" });

const themeInitScript = `(()=>{try{var t=localStorage.getItem('hbn-theme');if(t==='light'){document.documentElement.classList.remove('dark');}else{document.documentElement.classList.add('dark');}}catch(e){document.documentElement.classList.add('dark');}})();`;

export const metadata: Metadata = {
  title: {
    default: "Hayling Bike Night",
    template: "%s · Hayling Bike Night",
  },
  description:
    "Fully marshalled motorcycle meet — Thursdays 5pm–late, April–September at John’s Café, Hayling Island (PO11 0AS).",
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en-GB" className="dark" suppressHydrationWarning>
      <body
        className={`${display.variable} ${body.variable} min-h-screen flex flex-col bg-surface font-body text-ink antialiased`}
      >
        {/* Inline script in body: runs before paint; avoids next/script + App Router edge cases and manual <head>. */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        {/* Google tag (gtag.js) — Google Analytics */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_MEASUREMENT_ID}');
`}
        </Script>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <SiteHeader />
        <main id="main" className="flex-1">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
