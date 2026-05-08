import Link from "next/link";

const ADMIN_LINKS = [
  { href: "/admin", label: "Tours" },
  { href: "/admin/resumen", label: "Resumen" },
  { href: "/admin/media", label: "Medios" },
  { href: "/admin/pedidos", label: "Reservas" },
  { href: "/admin/pagos", label: "Pagos" },
  { href: "/admin/pagos-manuales", label: "Pagos Manuales" },
  { href: "/admin/configuracion", label: "Configuración" },
] as const;

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-slate-100">
      <div className="border-b border-slate-200 bg-slate-950 text-white shadow-sm">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-300">Panel administrativo</p>
            <h1 className="text-2xl font-black">Gestión interna de la plataforma</h1>
          </div>
          <nav className="flex flex-wrap gap-2">
            {ADMIN_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-bold text-slate-100 transition hover:bg-white/10"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
      {children}
    </div>
  );
}