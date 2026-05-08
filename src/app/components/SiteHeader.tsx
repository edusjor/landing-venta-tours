"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const MAIN_LINKS = [
  { href: "/", label: "Inicio" },
  { href: "/tours", label: "Tours" },
  { href: "/agencias/acceso", label: "Agencias" },
  { href: "/quienes-somos", label: "Nosotros" },
  { href: "/contacto", label: "Contacto" },
] as const;

const LANDING_LINKS = [
  { href: "/#que-incluye", label: "Que incluye", openInNewTab: false },
  { href: "/#demo-funcional", label: "Demo", openInNewTab: false },
  { href: "/#como-funciona", label: "Como funciona", openInNewTab: false },
  { href: "/#faq", label: "FAQ", openInNewTab: false },
  { href: "/demo-sitio", label: "Ver demos", openInNewTab: true },
  { href: "/#formulario-contacto", label: "Contacto", openInNewTab: false, isButton: true },
] as const;

function HamburgerIcon({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {open ? (
        <>
          <path d="M18 6 6 18" />
          <path d="m6 6 12 12" />
        </>
      ) : (
        <>
          <path d="M4 7h16" />
          <path d="M4 12h16" />
          <path d="M4 17h16" />
        </>
      )}
    </svg>
  );
}

type SiteHeaderAgency = {
  name?: string | null;
  logoUrl?: string | null;
};

const DEFAULT_LOGO = "/tour-placeholder.svg";

export default function SiteHeader({ agency }: { agency?: SiteHeaderAgency | null }) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const agencyName = String(agency?.name ?? "Agencia de Tours").trim() || "Agencia de Tours";
  const logoUrl = String(agency?.logoUrl ?? "").trim() || DEFAULT_LOGO;
  const isMainLanding = pathname === "/";
  const navLinks = isMainLanding
    ? LANDING_LINKS
    : MAIN_LINKS.map((item) => ({ ...item, openInNewTab: false, isButton: false }));

  return (
    <header className="site-header">
      <div className="relative mx-auto w-full max-w-6xl px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" aria-label={agencyName} className="inline-flex items-center">
            <img
              src={logoUrl}
              alt={agencyName}
              className="h-12 w-auto max-w-[180px] object-contain md:h-14 md:max-w-[220px]"
              loading="eager"
            />
          </Link>

          {!isMainLanding ? (
            <nav className="hidden gap-6 text-sm font-bold uppercase tracking-wide text-slate-100 md:flex">
              {navLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  target={item.openInNewTab ? "_blank" : undefined}
                  rel={item.openInNewTab ? "noreferrer" : undefined}
                  className={item.isButton ? "rounded-full bg-amber-400 px-4 py-2 text-slate-900" : undefined}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            {!isMainLanding ? (
            <button
              type="button"
              onClick={() => setIsOpen((value) => !value)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-white/10 text-slate-100 transition hover:bg-white/20 md:hidden"
              aria-label={isOpen ? "Cerrar menu principal" : "Abrir menu principal"}
              aria-expanded={isOpen}
              aria-controls="mobile-main-menu"
            >
              <HamburgerIcon open={isOpen} />
            </button>
            ) : null}
          </div>
        </div>

        {!isMainLanding && isOpen && (
          <nav
            id="mobile-main-menu"
            className="absolute left-4 right-4 top-[calc(100%-0.25rem)] z-50 grid gap-2 rounded-2xl border border-white/20 bg-emerald-950/95 p-3 text-sm font-bold uppercase tracking-wide text-slate-100 shadow-2xl shadow-black/25 backdrop-blur-sm md:hidden"
          >
            {navLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                target={item.openInNewTab ? "_blank" : undefined}
                rel={item.openInNewTab ? "noreferrer" : undefined}
                className={item.isButton
                  ? "rounded-lg bg-amber-400 px-3 py-2 text-center font-extrabold text-slate-900 transition hover:bg-amber-300"
                  : "rounded-lg px-3 py-2 transition hover:bg-white/15"}
                onClick={() => setIsOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}