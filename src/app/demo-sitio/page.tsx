import Link from "next/link";

export default function DemoSiteHomePage() {
  const highlights = [
    "Experiencias nacionales e internacionales",
    "Aliados locales y operadores verificados",
    "Acompanamiento cercano antes, durante y despues",
  ] as const;

  const featuredTours = [
    {
      featured: true,
      category: "Naturaleza",
      title: "Aqui va tu tour estrella",
      desc: "Un resumen atractivo del tour principal con beneficios claros, inclusiones y estilo de experiencia.",
      location: "Aqui va la ubicacion",
      price: "Desde $129",
      image:
        "https://images.unsplash.com/photo-1501554728187-ce583db33af7?auto=format&fit=crop&w=1400&q=80",
    },
    {
      featured: false,
      category: "Cultura",
      title: "Aqui va tu circuito cultural",
      desc: "Ideal para mostrar experiencias autenticas, comunidades locales y actividades guiadas paso a paso.",
      location: "Aqui va la ubicacion",
      price: "Desde $189",
      image:
        "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1400&q=80",
    },
    {
      featured: true,
      category: "Playa",
      title: "Aqui va tu experiencia de playa",
      desc: "Perfecto para mostrar itinerario, logistica resuelta y una propuesta irresistible para el cliente final.",
      location: "Aqui va la ubicacion",
      price: "Desde $99",
      image:
        "https://images.unsplash.com/photo-1473116763249-2faaef81ccda?auto=format&fit=crop&w=1400&q=80",
    },
  ] as const;

  const reasons = [
    {
      title: "Turismo responsable",
      desc: "Aqui explicas como tu agencia aporta valor real a comunidades, proveedores y viajeros.",
    },
    {
      title: "Calidad y seguridad",
      desc: "Aqui va tu promesa de servicio, protocolos y experiencia operativa para generar confianza.",
    },
    {
      title: "Destinos variados",
      desc: "Aqui muestras que cubres naturaleza, playa, aventura o internacional segun el perfil del cliente.",
    },
    {
      title: "Atencion personalizada",
      desc: "Aqui dejas claro que acompanias por WhatsApp, llamada o email en todo el proceso.",
    },
  ] as const;

  const partners = [
    "Proveedor A",
    "Proveedor B",
    "Proveedor C",
    "Proveedor D",
    "Proveedor E",
    "Proveedor F",
    "Proveedor G",
    "Proveedor H",
  ] as const;

  return (
    <div className="bg-slate-50 text-slate-900">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_12%,rgba(16,185,129,0.15),transparent_42%),linear-gradient(180deg,#ecfdf5_0%,#f8fafc_65%)]" />
        <div className="relative mx-auto max-w-6xl px-4 py-14 sm:py-16">
          <div className="grid gap-7 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <p className="inline-flex rounded-full border border-emerald-200 bg-emerald-100 px-3 py-1 text-xs font-extrabold uppercase tracking-[0.2em] text-emerald-800">
                Home demo editable
              </p>
              <h1 className="mt-4 text-4xl font-black leading-tight text-slate-950 sm:text-5xl">
                Descubre como puede verse la home de tu agencia con tu propia informacion
              </h1>
              <p className="mt-4 max-w-2xl text-base text-slate-700 sm:text-lg">
                Estructura inspirada en agencias de tours que venden bien: mensaje claro, tours destacados,
                confianza de aliados y contacto directo.
              </p>

              <div className="mt-6 grid gap-2 sm:max-w-xl">
                {highlights.map((item) => (
                  <p key={item} className="rounded-xl border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-800 shadow-sm">
                    {item}
                  </p>
                ))}
              </div>

              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  href="/demo-sitio/tours"
                  className="rounded-xl bg-emerald-600 px-6 py-3 font-extrabold text-white transition hover:bg-emerald-500"
                >
                  Ver tours
                </Link>
                <Link
                  href="/demo-sitio/contacto"
                  className="rounded-xl border border-slate-300 bg-white px-6 py-3 font-bold text-slate-800 transition hover:bg-slate-100"
                >
                  Planea con nosotros
                </Link>
              </div>
            </div>

            <div className="overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-xl">
              <img
                src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80"
                alt="Destino turistico de playa para demo"
                className="h-72 w-full object-cover sm:h-80"
              />
              <div className="p-5">
                <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-emerald-700">Espacio personalizable</p>
                <p className="mt-2 text-lg font-black text-slate-900">Aqui va tu propuesta principal de temporada</p>
                <p className="mt-2 text-sm text-slate-600">
                  Puedes destacar un tour, promocion o circuito clave con una imagen potente y CTA directo.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-6">
        <div className="rounded-3xl border border-emerald-100 bg-white p-7 shadow-sm">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-emerald-700">Turismo local e internacional</p>
            <h2 className="mt-3 text-3xl font-black text-slate-950">Una seccion para explicar como trabaja tu agencia</h2>
            <p className="mt-3 text-slate-700">
              Aqui muestras tu enfoque: calidad operativa, proveedores de confianza y experiencia real para cada perfil de viajero.
            </p>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-extrabold text-emerald-800">
              Alcance: Nacional + Intl
            </span>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-extrabold text-emerald-800">
              Aliados: +30
            </span>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-extrabold text-emerald-800">
              Atencion: Personalizada
            </span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-emerald-700">Tours destacados</p>
            <h2 className="mt-2 text-3xl font-black text-slate-950">Asi se verian tus paquetes estrella</h2>
          </div>
          <Link href="/demo-sitio/tours" className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-extrabold text-slate-800 hover:bg-slate-100">
            Ver todos los tours
          </Link>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-3">
          {featuredTours.map((tour) => (
            <article key={tour.title} className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-xl shadow-slate-300/40">
              <div className="relative">
                <img src={tour.image} alt={tour.title} className="h-44 w-full object-cover" />
                {tour.featured && (
                  <span className="absolute left-3 top-3 rounded-full bg-amber-400 px-3 py-1 text-xs font-black text-slate-900">Destacado</span>
                )}
              </div>
              <div className="flex flex-1 flex-col p-5">
                <p className="text-xs font-extrabold uppercase tracking-wide text-emerald-700">{tour.category}</p>
                <h3 className="mt-1 text-base font-bold leading-snug text-slate-900">{tour.title}</h3>
                <p className="mt-2 line-clamp-3 whitespace-pre-line text-slate-600">{tour.desc}</p>

                <div className="mt-3 min-h-10">
                  <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">
                    {tour.location}
                  </span>
                </div>

                <div className="mt-auto flex items-center justify-between gap-3 pt-4">
                  <span className="text-3xl font-black text-emerald-600">{tour.price}</span>
                  <Link
                    href="/demo-sitio/tours"
                    className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-extrabold text-slate-900 transition hover:bg-amber-300"
                  >
                    Ver detalles
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="rounded-3xl border border-slate-200 bg-white p-7">
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-emerald-700">Por que elegir tu agencia</p>
          <h2 className="mt-2 text-3xl font-black text-slate-950">Bloque de confianza que impulsa conversion</h2>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {reasons.map((reason) => (
              <div key={reason.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="text-lg font-black text-slate-900">{reason.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{reason.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="rounded-3xl bg-emerald-950 px-6 py-8 text-white">
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-emerald-200">Aliados turisticos</p>
          <h2 className="mt-2 text-3xl font-black">Aqui iria el carrusel de proveedores de tu agencia</h2>
          <p className="mt-3 max-w-3xl text-sm text-emerald-100">
            En produccion, esta seccion puede mostrar logos reales, convenios y certificaciones para reforzar credibilidad.
          </p>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {partners.map((partner) => (
              <div key={partner} className="rounded-xl border border-emerald-800 bg-emerald-900/60 px-3 py-3 text-center text-sm font-bold text-emerald-100">
                {partner}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-emerald-700">Contacto directo</p>
          <h2 className="mt-2 text-3xl font-black text-slate-950">Listo para planear tu proximo viaje</h2>
          <p className="mt-3 max-w-2xl text-slate-700">
            Este cierre replica la idea de una home comercial: resolver dudas rapido y mover al usuario a accion.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/demo-sitio/contacto" className="rounded-xl bg-emerald-600 px-6 py-3 font-extrabold text-white hover:bg-emerald-500">
              Ver contacto demo
            </Link>
            <Link href="/#formulario-contacto" className="rounded-xl border border-slate-300 bg-white px-6 py-3 font-extrabold text-slate-900 hover:bg-slate-100">
              Solicitar esta web para mi agencia
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
