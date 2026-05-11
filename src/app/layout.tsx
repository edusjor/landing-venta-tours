import type { Metadata } from "next";
import { headers } from "next/headers";
import Script from "next/script";
import { Nunito, Kaushan_Script } from "next/font/google";
import AppFrame from "./components/AppFrame";
import { resolvePublicAgencyFromHeaders } from "../lib/publicAgency";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
});

const kaushan = Kaushan_Script({
  variable: "--font-kaushan",
  subsets: ["latin"],
  weight: ["400"],
});

function resolveMetadataBase(): URL | undefined {
  const directSiteUrl = String(process.env.NEXT_PUBLIC_SITE_URL ?? "").trim();
  const rootDomain = String(process.env.NEXT_PUBLIC_PLATFORM_ROOT_DOMAIN ?? process.env.PLATFORM_ROOT_DOMAIN ?? "").trim();
  const candidate = directSiteUrl || (rootDomain ? `https://${rootDomain}` : "");

  if (!candidate) return undefined;

  try {
    return new URL(candidate);
  } catch {
    return undefined;
  }
}

export const metadata: Metadata = {
  metadataBase: resolveMetadataBase(),
  title: String(process.env.NEXT_PUBLIC_PLATFORM_NAME ?? process.env.PLATFORM_DEFAULT_AGENCY_NAME ?? process.env.DEFAULT_AGENCY_NAME ?? 'Plataforma de Tours').trim() || 'Plataforma de Tours',
  description: String(process.env.NEXT_PUBLIC_PLATFORM_DESCRIPTION ?? process.env.PLATFORM_DEFAULT_AGENCY_DESCRIPTION ?? 'Sitio web de tours y experiencias').trim() || 'Sitio web de tours y experiencias',
};

const META_PIXEL_ID = "3137509159785214";
const GA_MEASUREMENT_ID = "G-CSQBTE03KR";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headerStore = await headers();
  const publicAgency = await resolvePublicAgencyFromHeaders(headerStore);
  const performancePolyfill = `(function(){
    if (typeof window === "undefined") return;
    var perf = window.performance;
    if (!perf) return;
    try {
      if (typeof perf.clearMarks !== "function") perf.clearMarks = function() {};
      if (typeof perf.clearMeasures !== "function") perf.clearMeasures = function() {};
    } catch (e) {
      try {
        Object.defineProperty(perf, "clearMarks", {
          configurable: true,
          writable: true,
          value: function() {},
        });
      } catch (_) {}
      try {
        Object.defineProperty(perf, "clearMeasures", {
          configurable: true,
          writable: true,
          value: function() {},
        });
      } catch (_) {}
    }
  })();`;

  return (
    <html lang="es">
      <head>
        <script dangerouslySetInnerHTML={{ __html: performancePolyfill }} />
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
        <Script id="meta-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${META_PIXEL_ID}');
fbq('track', 'PageView');`}
        </Script>
      </head>
      <body className={`${nunito.variable} ${kaushan.variable} min-h-screen bg-slate-100 text-slate-900`}>
        <noscript>
          <img
            alt=""
            height="1"
            width="1"
            style={{ display: "none" }}
            src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
          />
        </noscript>
        <AppFrame publicAgency={publicAgency}>{children}</AppFrame>
      </body>
    </html>
  );
}
