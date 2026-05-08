import type { Metadata } from "next";
import { headers } from "next/headers";
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

export const metadata: Metadata = {
  title: String(process.env.NEXT_PUBLIC_PLATFORM_NAME ?? process.env.PLATFORM_DEFAULT_AGENCY_NAME ?? process.env.DEFAULT_AGENCY_NAME ?? 'Plataforma de Tours').trim() || 'Plataforma de Tours',
  description: String(process.env.NEXT_PUBLIC_PLATFORM_DESCRIPTION ?? process.env.PLATFORM_DEFAULT_AGENCY_DESCRIPTION ?? 'Sitio web de tours y experiencias').trim() || 'Sitio web de tours y experiencias',
};

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
      </head>
      <body className={`${nunito.variable} ${kaushan.variable} min-h-screen bg-slate-100 text-slate-900`}>
        <AppFrame publicAgency={publicAgency}>{children}</AppFrame>
      </body>
    </html>
  );
}
