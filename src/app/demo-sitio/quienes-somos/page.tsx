export default function DemoSiteAboutPage() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-16">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-emerald-600">Nosotros (demo)</p>
        <h1 className="mt-3 text-4xl font-black text-slate-900">Quienes somos</h1>
        <p className="mt-4 text-slate-700">
          Esta seccion representa como podriamos contar la historia de tu agencia: trayectoria,
          especialidades, equipo y propuesta de valor para que el cliente confie antes de reservar.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl bg-emerald-50 p-4">
            <p className="font-extrabold text-emerald-900">Experiencia local</p>
            <p className="mt-1 text-sm text-emerald-800">Guias y operadores con conocimiento real del destino.</p>
          </div>
          <div className="rounded-xl bg-emerald-50 p-4">
            <p className="font-extrabold text-emerald-900">Atencion personalizada</p>
            <p className="mt-1 text-sm text-emerald-800">Asesoria segun el perfil del viajero.</p>
          </div>
          <div className="rounded-xl bg-emerald-50 p-4">
            <p className="font-extrabold text-emerald-900">Operacion confiable</p>
            <p className="mt-1 text-sm text-emerald-800">Informacion clara y reservas organizadas.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
