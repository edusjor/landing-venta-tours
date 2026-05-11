import Link from "next/link";
import LandingLeadForm from "./components/LandingLeadForm";

const HERO_SLIDES = [
  {
    src: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=2200&q=80",
    alt: "Montañas para tours de aventura",
  },
  {
    src: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=2200&q=80",
    alt: "Paisaje natural para agencia de turismo",
  },
  {
    src: "https://images.unsplash.com/photo-1506929562872-bb421503ef21?auto=format&fit=crop&w=2200&q=80",
    alt: "Viajeros en ruta ecoturística",
  },
  {
    src: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=2200&q=80",
    alt: "Costa para paquetes de tours",
  },
  {
    src: "https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=2200&q=80",
    alt: "Tour de naturaleza al amanecer",
  },
] as const;

const HERO_BENEFITS = [
  "Sitio web personalizado",
  "Catálogo de tours",
  "Reservas o pagos online",
  "Optimizado para móviles",
  "Panel de administración",
] as const;

const PROBLEM_CARDS = [
  "Demasiadas consultas repetidas",
  "Información desordenada",
  "Poca confianza al reservar",
] as const;

const WHAT_YOU_GET = [
  {
    title: "Catálogo de tours",
    desc: "Publica tus tours con fotos, precios, itinerario, duración, ubicación, inclusiones y detalles importantes.",
  },
  {
    title: "Página individual para cada tour",
    desc: "Cada paquete puede tener su propia página con información completa para que el cliente entienda mejor antes de consultar o reservar.",
  },
  {
    title: "Formulario de consulta o reserva",
    desc: "Permite que los clientes envíen sus datos, seleccionen el tour de interés y soliciten más información.",
  },
  {
    title: "Pago online de tours",
    desc: "Según las necesidades de tu agencia, se puede integrar pago online, pago por depósito o solicitud de reserva.",
  },
  {
    title: "Panel de administración",
    desc: "Administra tours, precios, imágenes y contenido sin depender siempre de un programador.",
  },
  {
    title: "Diseño adaptado a tu marca",
    desc: "La web se personaliza con los colores, logo, estilo y contenido de tu agencia.",
  },
] as const;

const HOW_IT_WORKS = [
  {
    n: "01",
    title: "Analizamos tu agencia",
    desc: "Revisamos qué tipo de tours vendes, cómo reservas actualmente y qué necesita tu negocio.",
  },
  {
    n: "02",
    title: "Personalizamos tu web",
    desc: "Adaptamos el diseño, la estructura, los colores, el contenido y las funciones principales.",
  },
  {
    n: "03",
    title: "Publicas tus tours",
    desc: "Cargas o entregas la información de tus paquetes para que queden organizados en la web.",
  },
  {
    n: "04",
    title: "Recibes consultas o reservas",
    desc: "Tus clientes pueden ver la información completa y contactarte con mayor claridad.",
  },
] as const;

const BENEFITS = [
  "Mejora la imagen profesional de tu agencia",
  "Ordena la información de tus tours",
  "Reduce mensajes repetidos",
  "Ayuda a generar confianza",
  "Facilita las consultas y reservas",
  "Permite escalar tu operación turística",
] as const;

const IDEAL_FOR = [
  "Agencias de tours nacionales",
  "Agencias de viajes internacionales",
  "Operadores turísticos",
  "Empresas que venden paquetes turísticos",
  "Guías o negocios que quieren formalizar su oferta",
  "Agencias que quieren dejar de depender solo de redes sociales",
] as const;

const DEMO_FLOW_STEPS = [
  {
    n: "01",
    title: "Catálogo con filtros",
    desc: "Tus clientes encuentran tours por destino, categoría, duración y presupuesto.",
  },
  {
    n: "02",
    title: "Detalle y selección de fecha",
    desc: "Revisan información completa del tour y eligen la fecha ideal para reservar.",
  },
  {
    n: "03",
    title: "Reserva y pago online",
    desc: "Completan el checkout  pagando con su tarjeta de crédito o débito.",
  },
] as const;

const FAQS = [
  {
    q: "¿Es una página web normal o un sistema de tours?",
    a: "Es una página web desarrollada especialmente para agencias de turismo, con estructura para mostrar tours, organizar información y facilitar consultas o reservas.",
  },
  {
    q: "¿Puedo administrar mis tours?",
    a: "Sí. La idea es que la agencia pueda gestionar su información principal, como tours, precios, imágenes y detalles.",
  },
  {
    q: "¿Se puede agregar pago online?",
    a: "Sí, dependiendo de la necesidad de la agencia se puede integrar pago online, pago por depósito o formularios de reserva.",
  },
  {
    q: "¿La web se adapta a mi marca?",
    a: "Sí. El diseño se personaliza con el logo, colores, contenido e imagen de la agencia.",
  },
  {
    q: "¿Sirve si ya tengo una página web?",
    a: "Sí. Se puede valorar si conviene mejorar la web actual o desarrollar una nueva estructura más enfocada en tours.",
  },
] as const;

export default function Home() {
  return (
    <div className="overflow-x-hidden bg-white">
      <section id="inicio" className="hero-wrap relative flex min-h-screen items-center overflow-hidden scroll-mt-28">
        <div className="hero-slideshow" aria-hidden="true">
          {HERO_SLIDES.map((slide, i) => (
            <div
              key={slide.src}
              className="hero-slide"
              style={{ backgroundImage: `url(${slide.src})`, animationDelay: `${i * 6}s` }}
            />
          ))}
          <div className="hero-overlay" />
          <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/80 via-emerald-950/20 to-transparent" />
        </div>

        <div className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-16 pt-28 sm:px-6 sm:pb-24 sm:pt-36">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-white backdrop-blur-sm sm:text-sm">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-300" />
            Servicio personalizado para agencias de tours
          </div>

          <h1 className="max-w-4xl text-4xl font-extrabold leading-[1.08] text-white drop-shadow-lg sm:text-6xl md:text-7xl">
            Tu agencia de tours, lista para vender online
          </h1>

          <p className="mt-5 max-w-3xl text-base leading-relaxed text-white/85 sm:mt-6 sm:text-xl">
            Desarrollamos una página web profesional con sistema de tours para que tu agencia
            pueda mostrar paquetes, recibir consultas, gestionar reservas y vender de forma más ordenada.
          </p>

          <div className="mt-8 flex flex-wrap gap-3 sm:mt-10 sm:gap-4">
            <Link
              href="#formulario-contacto"
              className="inline-flex w-full items-center justify-center rounded-xl bg-emerald-500 px-6 py-3 text-base font-extrabold text-white shadow-2xl shadow-emerald-950/40 transition hover:bg-emerald-400 sm:w-auto sm:px-8 sm:py-4 sm:text-lg"
            >
              Solicitar información
            </Link>
            <Link
              href="#que-incluye"
              className="inline-flex w-full items-center justify-center rounded-xl border border-white/30 bg-white/10 px-6 py-3 text-base font-bold text-white backdrop-blur-sm transition hover:bg-white/20 sm:w-auto sm:px-8 sm:py-4 sm:text-lg"
            >
              Ver que incluye
            </Link>
            <Link
              href="/demo-sitio/tours"
              target="_blank"
              rel="noreferrer"
              className="inline-flex w-full items-center justify-center rounded-xl border border-emerald-200/45 bg-emerald-950/30 px-6 py-3 text-base font-bold text-emerald-100 transition hover:bg-emerald-900/40 sm:w-auto sm:px-8 sm:py-4 sm:text-lg"
            >
              Ver demo
            </Link>
          </div>

          <div className="mt-8 grid max-w-sm grid-cols-1 gap-2 sm:mt-10 sm:flex sm:max-w-none sm:flex-wrap sm:gap-3">
            {HERO_BENEFITS.map((item) => (
              <span
                key={item}
                className="rounded-full border border-white/15 bg-black/25 px-4 py-2 text-sm font-medium text-white/90 backdrop-blur-sm"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section id="problema" className="bg-white py-16 scroll-mt-28 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-emerald-600 sm:text-sm">Problema común</p>
            <h2 className="mt-3 text-3xl font-extrabold leading-tight text-emerald-950 sm:text-5xl">
              ¿Todavía vendes tus tours solo por WhatsApp o redes sociales?
            </h2>
            <p className="mt-4 text-base text-slate-600 sm:mt-5 sm:text-lg">
              Cuando la información está dispersa, los clientes preguntan lo mismo una y otra vez:
              precios, fechas, itinerarios, qué incluye el tour y cómo reservar. Una web bien estructurada
              ayuda a que tu agencia se vea más profesional y que tus clientes entiendan mejor lo que
              ofreces antes de contactarte.
            </p>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {PROBLEM_CARDS.map((card) => (
              <div key={card} className="rounded-2xl border border-emerald-100 bg-emerald-50/55 p-7 shadow-sm">
                <h3 className="text-xl font-extrabold text-emerald-900">{card}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="que-incluye" className="section-band py-16 scroll-mt-28 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-emerald-600 sm:text-sm">Qué recibe la agencia</p>
            <h2 className="mt-3 text-3xl font-extrabold leading-tight text-emerald-950 sm:text-5xl">
              Una web pensada para agencias de tours
            </h2>
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {WHAT_YOU_GET.map((item) => (
              <article key={item.title} className="rounded-2xl border border-emerald-100 bg-white p-7 shadow-sm">
                <h3 className="text-lg font-extrabold text-emerald-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="demo-funcional" className="jungle-band py-16 text-white scroll-mt-28 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-emerald-300 sm:text-sm">Demo funcional</p>
            <h2 className="mt-3 text-3xl font-extrabold sm:text-5xl">Este sería el flujo que tendría tu agencia online</h2>
            <p className="mt-4 text-emerald-100/85">
              Esta vista resume la experiencia que vivirá tu cliente desde que entra al catálogo
              hasta que completa la reserva.
            </p>
          </div>

          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {DEMO_FLOW_STEPS.map((step) => (
              <article key={step.n} className="rounded-2xl border border-white/25 bg-white/10 p-6 backdrop-blur-sm">
                <span className="inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-extrabold text-emerald-100">Paso {step.n}</span>
                <h3 className="mt-4 text-2xl font-extrabold text-white">{step.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-emerald-50/90">{step.desc}</p>
              </article>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/demo-sitio/tours"
              target="_blank"
              rel="noreferrer"
              className="inline-flex w-full items-center justify-center rounded-xl bg-white px-6 py-3 text-sm font-extrabold text-emerald-900 transition hover:bg-emerald-100 sm:w-auto sm:px-7"
            >
              Probar flujo demo completo
            </Link>
            <Link
              href="#formulario-contacto"
              className="inline-flex w-full items-center justify-center rounded-xl border border-white/35 bg-white/10 px-6 py-3 text-sm font-extrabold text-white transition hover:bg-white/20 sm:w-auto sm:px-7"
            >
              Solicitar sistema para mi agencia
            </Link>
          </div>
        </div>
      </section>

      <section id="como-funciona" className="bg-white py-16 scroll-mt-28 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-emerald-600 sm:text-sm">Cómo funciona</p>
            <h2 className="mt-3 text-3xl font-extrabold text-emerald-950 sm:text-5xl">Así desarrollamos tu sistema de tours</h2>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {HOW_IT_WORKS.map((step) => (
              <article key={step.n} className="rounded-2xl border border-slate-100 bg-slate-50 p-6 shadow-sm">
                <p className="text-5xl font-black leading-none text-emerald-100">{step.n}</p>
                <h3 className="mt-4 text-lg font-extrabold text-emerald-900">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{step.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="beneficios" className="section-band py-16 scroll-mt-28 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-emerald-600 sm:text-sm">Beneficios</p>
            <h2 className="mt-3 text-3xl font-extrabold text-emerald-950 sm:text-5xl">
              Más que una página bonita: una herramienta para vender mejor
            </h2>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {BENEFITS.map((benefit) => (
              <div key={benefit} className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
                <p className="font-bold text-slate-700">{benefit}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="para-quien" className="bg-white py-16 scroll-mt-28 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-emerald-600 sm:text-sm">Para quién es</p>
            <h2 className="mt-3 text-3xl font-extrabold text-emerald-950 sm:text-5xl">Este sistema es ideal para</h2>
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {IDEAL_FOR.map((item) => (
              <div key={item} className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                <p className="font-semibold text-slate-700">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="formulario-contacto" className="bg-emerald-950 py-16 text-white scroll-mt-28 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-emerald-300 sm:text-sm">Solicitar cotización</p>
            <h2 className="mt-3 text-3xl font-extrabold sm:text-5xl">Solicita información para tu agencia</h2>
            <p className="mt-4 text-base text-emerald-100/85 sm:text-lg">
              Déjanos tus datos y cuéntanos un poco sobre tu agencia. Te contactaremos para explicarte
              cómo puede funcionar tu página web con sistema de tours.
            </p>
          </div>

          <LandingLeadForm />
        </div>
      </section>

      <section id="faq" className="bg-white py-16 scroll-mt-28 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-emerald-600 sm:text-sm">FAQ</p>
            <h2 className="mt-3 text-3xl font-extrabold text-emerald-950 sm:text-5xl">Preguntas frecuentes</h2>
          </div>

          <div className="mt-12 grid gap-4">
            {FAQS.map((faq) => (
              <details key={faq.q} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <summary className="cursor-pointer text-lg font-extrabold text-slate-900">{faq.q}</summary>
                <p className="mt-3 leading-relaxed text-slate-600">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-emerald-950 py-16 text-white sm:py-24">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="text-3xl font-extrabold leading-tight sm:text-5xl">
            Haz que tu agencia venda sus tours de forma más profesional
          </h2>
          <p className="mt-4 text-base text-emerald-200/85 sm:mt-5 sm:text-lg">
            Organiza tus paquetes, mejora la confianza de tus clientes y lleva tu agencia a una web
            preparada para vender online.
          </p>
          <Link
            href="#formulario-contacto"
            className="mt-7 inline-flex w-full items-center justify-center rounded-xl bg-emerald-500 px-6 py-3 text-base font-extrabold text-white transition hover:bg-emerald-400 sm:mt-8 sm:w-auto sm:px-10 sm:py-4 sm:text-lg"
          >
            Solicitar información
          </Link>
        </div>
      </section>
    </div>
  );
}
