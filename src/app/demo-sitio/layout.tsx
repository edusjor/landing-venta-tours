import Link from "next/link";

const NAV = [
  { href: "/demo-sitio", label: "Inicio" },
  { href: "/demo-sitio/tours", label: "Tours" },
  { href: "/demo-sitio/quienes-somos", label: "Nosotros" },
  { href: "/demo-sitio/contacto", label: "Contacto" },
] as const;

export default function DemoSiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="bg-amber-100 px-4 py-2 text-center text-xs font-extrabold uppercase tracking-wide text-amber-900">
        Demo comercial: así podría verse la web de tu agencia según tu información
      </div>

      <header className="sticky top-0 z-40 border-b border-emerald-900/20 bg-emerald-950 text-white backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/demo-sitio" className="text-lg font-extrabold">Demo Agency Tours</Link>
          <div className="flex items-center justify-end gap-2 sm:gap-3">
            <nav className="hidden items-center gap-3 text-sm font-bold md:flex">
              {NAV.map((item) => (
                <Link key={item.href} href={item.href} className="rounded-full px-3 py-1.5 transition hover:bg-white/15">
                  {item.label}
                </Link>
              ))}
            </nav>
            <Link
              href="/#formulario-contacto"
              className="rounded-xl bg-emerald-400 px-3 py-2 text-xs font-extrabold text-emerald-950 transition hover:bg-emerald-300 sm:px-4 sm:text-sm"
            >
              Solicitar una web
            </Link>

            <details className="relative md:hidden">
              <summary className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-lg border border-white/25 bg-white/10 text-lg font-black text-white hover:bg-white/15">
                <span aria-hidden="true">☰</span>
                <span className="sr-only">Abrir menú</span>
              </summary>
              <div className="absolute right-0 mt-2 w-52 rounded-xl border border-emerald-900/30 bg-emerald-950 p-2 shadow-xl">
                <nav className="flex flex-col gap-1 text-sm font-bold">
                  {NAV.map((item) => (
                    <Link key={item.href} href={item.href} className="rounded-lg px-3 py-2 transition hover:bg-white/10">
                      {item.label}
                    </Link>
                  ))}
                </nav>
              </div>
            </details>
          </div>
        </div>
      </header>

      <main>{children}</main>

      <footer className="mt-10 bg-emerald-950 py-8 text-emerald-100">
        <div className="mx-auto max-w-6xl px-4">
          <p className="font-bold">Demo de referencia para agencias de turismo.</p>
          <p className="mt-1 text-sm text-emerald-200">Este entorno es independiente de la landing de venta y existe solo para mostrar el flujo real.</p>
        </div>
      </footer>
    </div>
  );
}
