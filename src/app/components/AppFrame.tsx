"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import SiteHeader from "./SiteHeader";

type PublicAgencyChrome = {
  name: string;
  description?: string | null;
  email?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  logoUrl?: string | null;
};

export default function AppFrame({
  children,
  publicAgency,
}: Readonly<{
  children: React.ReactNode;
  publicAgency: PublicAgencyChrome | null;
}>) {
  const pathname = usePathname();
  const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/");
  const isDemoSiteRoute = pathname === "/demo-sitio" || pathname.startsWith("/demo-sitio/");
  const isMainLandingRoute = pathname === "/";

  if (isAdminRoute || isDemoSiteRoute) {
    return <main>{children}</main>;
  }

  const agencyName = publicAgency?.name || "Agencia de Tours";
  const agencyDescription = publicAgency?.description || "Sitio web de tours y experiencias";

  return (
    <>
      {!isMainLandingRoute ? <SiteHeader agency={publicAgency} /> : null}
      <main>{children}</main>
      <footer className="mt-12 bg-slate-900 py-10 text-slate-200">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 md:grid-cols-3 md:items-start">
          <div>
            <p className="text-2xl font-extrabold text-white">{agencyName}</p>
            <p className="text-sm text-slate-400">{agencyDescription}</p>
            {publicAgency?.email ? <p className="mt-3 text-sm text-slate-300">{publicAgency.email}</p> : null}
            {publicAgency?.phone ? <p className="text-sm text-slate-300">{publicAgency.phone}</p> : null}
            {publicAgency?.whatsapp ? <p className="text-sm text-slate-300">WhatsApp: {publicAgency.whatsapp}</p> : null}
          </div>
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Menu</p>
            <nav className="grid gap-2 text-sm font-semibold">
              <Link href="/">Inicio</Link>
              <Link href="/tours">Tours</Link>
              <Link href="/quienes-somos">Sobre nosotros</Link>
              <Link href="/contacto">Contacto</Link>
            </nav>
          </div>
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Legal</p>
            <nav className="grid gap-2 text-sm font-semibold">
              <Link href="/legal/aviso-legal">Aviso legal</Link>
              <Link href="/legal/terminos-y-condiciones-generales">Términos y condiciones generales</Link>
              <Link href="/legal/politica-de-privacidad">Política de privacidad</Link>
              <Link href="/legal/informacion-de-cookies">Información de cookies</Link>
            </nav>
          </div>
          <p className="text-xs text-slate-400 md:col-span-3">© 2026 {agencyName}. Todos los derechos reservados.</p>
        </div>
      </footer>
    </>
  );
}