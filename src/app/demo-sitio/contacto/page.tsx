import Link from "next/link";

export default function DemoSiteContactPage() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-16">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-emerald-600">Contacto (demo)</p>
        <h1 className="mt-3 text-4xl font-black text-slate-900">Contáctanos</h1>
        <p className="mt-4 text-slate-700">
          Este formulario es una referencia de cómo tu agencia podría capturar solicitudes de viaje.
        </p>

        <div className="mt-5 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
          Vista solo demostración: este formulario está bloqueado para evitar confusiones.
          Para solicitar tu web, usa el formulario real de solicitud{" "}
          <Link href="/#formulario-contacto" className="underline decoration-2 underline-offset-2 hover:text-amber-700">
            aquí
          </Link>
          .
        </div>

        <form className="mt-6 grid gap-4 md:grid-cols-2">
          <fieldset disabled className="contents">
            <input
              placeholder="Nombre completo"
              className="rounded-xl border border-slate-300 bg-slate-100 px-4 py-3 text-slate-500"
            />
            <input
              placeholder="Correo"
              type="email"
              className="rounded-xl border border-slate-300 bg-slate-100 px-4 py-3 text-slate-500"
            />
            <input
              placeholder="WhatsApp"
              className="rounded-xl border border-slate-300 bg-slate-100 px-4 py-3 text-slate-500"
            />
            <input
              placeholder="País"
              className="rounded-xl border border-slate-300 bg-slate-100 px-4 py-3 text-slate-500"
            />
            <textarea
              placeholder="¿Qué tour te interesa?"
              rows={5}
              className="rounded-xl border border-slate-300 bg-slate-100 px-4 py-3 text-slate-500 md:col-span-2"
            />
            <button
              type="button"
              className="cursor-not-allowed rounded-xl bg-slate-300 px-5 py-3 font-extrabold text-slate-600 md:col-span-2"
            >
              Formulario bloqueado en demo
            </button>
          </fieldset>
        </form>

        <Link
          href="/#formulario-contacto"
          className="mt-5 inline-block rounded-xl bg-emerald-600 px-5 py-3 font-extrabold text-white transition hover:bg-emerald-500"
        >
          Ir al formulario real de solicitud
        </Link>
      </div>
    </section>
  );
}
