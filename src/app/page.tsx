import type { Metadata } from "next";
import Link from "next/link";
import FormAnchorLink from "./components/FormAnchorLink";
import LandingLeadForm from "./components/LandingLeadForm";

type IconKey = "catalog" | "tour" | "reserve" | "panel" | "brand" | "wallet";

const DEMO_URL = "/demo-sitio/tours";

const HERO_SLIDES = [
  "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=2200&q=80",
  "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=2200&q=80",
  "https://images.unsplash.com/photo-1506929562872-bb421503ef21?auto=format&fit=crop&w=2200&q=80",
  "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=2200&q=80",
  "https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=2200&q=80",
] as const;

const HERO_BENEFITS = [
  "Publica tus tours fácilmente",
  "Recibe reservas desde la web",
  "Muestra una imagen más profesional de tu agencia",
] as const;

const TARGET_AUDIENCE = [
  "Agencias que hoy dependen de WhatsApp o redes sociales para vender",
  "Operadores turísticos que quieren un catálogo claro y páginas de tour compartibles",
  "Equipos que buscan crecer con reservas y pagos online en un flujo más ordenado",
] as const;

const DEMO_STEPS = [
  {
    n: "01",
    title: "Navega el catálogo de tours",
    desc: "Mira cómo se mostrarían tus paquetes turísticos en una web clara y ordenada.",
  },
  {
    n: "02",
    title: "Revisa una página de tour",
    desc: "Observa cómo se presentan fotos, descripción, precios, itinerario y detalles importantes.",
  },
  {
    n: "03",
    title: "Simula una reserva",
    desc: "Prueba el formulario como si fueras un cliente interesado.",
  },
  {
    n: "04",
    title: "Imagina tu agencia usando este sistema",
    desc: "La demo es una base de ejemplo que puede adaptarse con tu logo, colores, tours, imágenes y datos de contacto.",
  },
] as const;

const WITHOUT_SYSTEM = [
  "Clientes preguntando lo mismo por WhatsApp",
  "Tours enviados en PDFs o mensajes sueltos",
  "Reservas anotadas manualmente",
  "Información difícil de actualizar",
  "Menos confianza al momento de vender",
] as const;

const WITH_GESTOUR = [
  "Cada tour tiene su propia página",
  "El cliente ve información clara antes de escribir",
  "Puedes recibir solicitudes desde la web",
  "Tu agencia se ve más profesional",
  "Puedes crecer hacia reservas y pagos online",
] as const;

const FEATURES = [
  {
    icon: "catalog" as const,
    title: "Catálogo de tours",
    desc: "Publica tours con fotos, precios, descripción, itinerario y detalles importantes.",
  },
  {
    icon: "tour" as const,
    title: "Página individual para cada tour",
    desc: "Cada experiencia puede tener su propia página lista para compartir con clientes.",
  },
  {
    icon: "reserve" as const,
    title: "Formulario de reserva o consulta",
    desc: "Tus clientes pueden enviar sus datos desde la web sin depender solo de mensajes sueltos.",
  },
  {
    icon: "panel" as const,
    title: "Panel administrativo",
    desc: "Administra tours, contenido e información desde un panel pensado para tu agencia.",
  },
  {
    icon: "brand" as const,
    title: "Diseño adaptable a tu marca",
    desc: "La web se personaliza con tu logo, colores, imágenes, información y estilo visual.",
  },
  {
    icon: "wallet" as const,
    title: "Preparado para pagos o depósitos",
    desc: "El sistema puede crecer hacia cobros online, depósitos o procesos de reserva más completos.",
  },
] as const;

const PROCESS_STEPS = [
  {
    n: "01",
    title: "Revisas la demo",
    desc: "Exploras el flujo y ves cómo podría funcionar tu propia web.",
  },
  {
    n: "02",
    title: "Nos cuentas sobre tu agencia",
    desc: "Compartes tus tours, tipo de servicio, logo, colores y necesidades principales.",
  },
  {
    n: "03",
    title: "Creamos tu web con sistema de tours",
    desc: "Adaptamos la plataforma para que puedas mostrar tus tours y recibir consultas de forma profesional.",
  },
] as const;

const CUSTOMIZATION_CHIPS = [
  "Logo de tu agencia",
  "Colores de marca",
  "Tours propios",
  "Imágenes reales",
  "WhatsApp integrado",
  "Formularios personalizados",
  "Información de contacto",
  "Diseño responsive",
] as const;

const FAQS = [
  {
    q: "¿La demo sería igual a mi web?",
    a: "No exactamente. La demo es una base para que puedas ver el flujo. Tu web se adapta con el nombre de tu agencia, logo, colores, tours, imágenes y datos propios.",
  },
  {
    q: "¿Necesito saber de tecnología?",
    a: "No. La idea es entregarte una solución lista para usar y acompañarte en la configuración inicial.",
  },
  {
    q: "¿Puedo administrar mis tours?",
    a: "Sí. Gestour está pensado para que puedas agregar, editar y organizar la información de tus tours desde un panel.",
  },
  {
    q: "¿Se puede integrar WhatsApp?",
    a: "Sí. La web puede incluir botones o formularios conectados al contacto de tu agencia.",
  },
  {
    q: "¿Se pueden recibir pagos online?",
    a: "Gestour puede prepararse para flujos de pago, depósitos o reservas según las necesidades de la agencia.",
  },
] as const;

export const metadata: Metadata = {
  title: "Gestour | Sistema web para agencias de tours",
  description:
    "Crea una web profesional para tu agencia de turismo, muestra tus tours, recibe reservas y permite que tus clientes naveguen una experiencia clara desde el primer contacto.",
};

function IconBadge({ icon }: { icon: IconKey }) {
  const base = "h-5 w-5";

  switch (icon) {
    case "catalog":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className={base}>
          <rect x="3" y="4" width="8" height="7" rx="1.5" />
          <rect x="13" y="4" width="8" height="7" rx="1.5" />
          <rect x="3" y="13" width="8" height="7" rx="1.5" />
          <rect x="13" y="13" width="8" height="7" rx="1.5" />
        </svg>
      );
    case "tour":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className={base}>
          <path d="M5 20V6a2 2 0 0 1 2-2h10l2 2v14z" />
          <path d="M9 10h6M9 14h6" />
        </svg>
      );
    case "reserve":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className={base}>
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <path d="M3 9h18M8 14h4" />
        </svg>
      );
    case "panel":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className={base}>
          <rect x="3" y="3" width="8" height="8" rx="1.5" />
          <rect x="13" y="3" width="8" height="5" rx="1.5" />
          <rect x="13" y="10" width="8" height="11" rx="1.5" />
          <rect x="3" y="13" width="8" height="8" rx="1.5" />
        </svg>
      );
    case "brand":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className={base}>
          <path d="M4 12l8-8 8 8-8 8z" />
          <path d="M12 8v8M8 12h8" />
        </svg>
      );
    case "wallet":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className={base}>
          <path d="M3 7a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <path d="M16 13h4M17.5 13h.01" />
        </svg>
      );
    default:
      return null;
  }
}

export default function Home() {
  return (
    <div className="overflow-x-hidden bg-white">
      <section id="inicio" className="hero-wrap relative flex min-h-screen items-center overflow-hidden scroll-mt-28">
        <div className="hero-slideshow" aria-hidden="true">
          {HERO_SLIDES.map((src, i) => (
            <div
              key={src}
              className="hero-slide"
              style={{ backgroundImage: `url(${src})`, animationDelay: `${i * 6}s` }}
            />
          ))}
          <div className="hero-overlay" />
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/90 via-emerald-900/60 to-cyan-950/30" />
        </div>

        <div className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-16 pt-28 sm:px-6 sm:pb-24 sm:pt-36">
          <p className="inline-flex rounded-full border border-white/30 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-100 backdrop-blur-sm">
            Solución web para agencias de tours
          </p>

          <h1 className="mt-5 max-w-5xl text-4xl font-black leading-[1.05] text-white sm:text-6xl md:text-7xl">
            Tu agencia de tours, lista para vender online
          </h1>

          <p className="mt-6 max-w-3xl text-base leading-relaxed text-emerald-50/90 sm:text-xl">
            Muestra tus tours, recibe consultas y permite que tus clientes naveguen una experiencia profesional desde tu propia web.
          </p>

          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-emerald-100/90 sm:text-lg">
            Explora la demo y mira cómo podría funcionar para tu agencia.
          </p>

          <div className="mt-9 flex flex-wrap gap-3 sm:gap-4">
            <Link
              href={DEMO_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex w-full items-center justify-center rounded-xl bg-emerald-400 px-6 py-3 text-base font-black text-emerald-950 shadow-xl shadow-emerald-950/35 transition hover:bg-emerald-300 sm:w-auto sm:px-8 sm:py-4 sm:text-lg"
            >
              Ver demo interactiva
            </Link>
            <FormAnchorLink className="inline-flex w-full items-center justify-center rounded-xl border border-white/35 bg-white/10 px-6 py-3 text-base font-black text-white backdrop-blur-sm transition hover:bg-white/20 sm:w-auto sm:px-8 sm:py-4 sm:text-lg">
              Solicitar propuesta
            </FormAnchorLink>
          </div>

          <div className="mt-10 grid items-start gap-3 sm:grid-cols-3">
            {HERO_BENEFITS.map((item) => (
              <div key={item} className="rounded-xl border border-white/20 bg-black/20 px-4 py-3 text-sm font-bold text-emerald-50 backdrop-blur-sm">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="para-quien" className="bg-white py-16 scroll-mt-28 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-600 sm:text-sm">Para quién es Gestour</p>
            <h2 className="mt-3 text-3xl font-black text-slate-950 sm:text-5xl">Pensado para dueños de agencias y operadores turísticos</h2>
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {TARGET_AUDIENCE.map((item) => (
              <article key={item} className="rounded-2xl border border-emerald-100 bg-emerald-50/55 p-6 shadow-sm">
                <p className="font-semibold text-slate-700">{item}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="demo-interactiva" className="jungle-band py-16 text-white scroll-mt-28 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-200 sm:text-sm">Demo interactiva</p>
            <h2 className="mt-3 text-3xl font-black sm:text-5xl">Antes de contratar, puedes navegar una demo real</h2>
            <p className="mt-4 text-emerald-100/90 sm:text-lg">
              No te mostramos solo una idea: puedes explorar una demo de Gestour y ver cómo tus clientes
              encontrarían tus tours, revisarían la información y enviarían una solicitud desde una web profesional.
            </p>
          </div>

          <div className="mt-14 grid gap-5 md:grid-cols-2">
            {DEMO_STEPS.map((step) => (
              <article key={step.n} className="rounded-2xl border border-white/25 bg-white/10 p-6 backdrop-blur-sm">
                <span className="inline-flex rounded-full border border-white/20 bg-black/20 px-3 py-1 text-xs font-black tracking-[0.14em] text-emerald-100">
                  Paso {step.n}
                </span>
                <h3 className="mt-4 text-xl font-black text-white sm:text-2xl">{step.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-emerald-50/90 sm:text-base">{step.desc}</p>
              </article>
            ))}
          </div>

          <div className="mt-10 flex justify-center">
            <Link
              href={DEMO_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex w-full items-center justify-center rounded-xl bg-white px-7 py-3 text-base font-black text-emerald-900 transition hover:bg-emerald-100 sm:w-auto sm:px-9 sm:py-4"
            >
              Entrar a la demo
            </Link>
          </div>
        </div>
      </section>

      <section id="problema-solucion" className="bg-white py-16 scroll-mt-28 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-600 sm:text-sm">Problema y solución</p>
            <h2 className="mt-3 text-3xl font-black text-slate-950 sm:text-5xl">Deja de manejar tus tours de forma manual</h2>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            <article className="rounded-3xl border border-rose-100 bg-rose-50/60 p-7">
              <h3 className="text-2xl font-black text-rose-900">Sin un sistema</h3>
              <ul className="mt-5 space-y-3">
                {WITHOUT_SYSTEM.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-rose-900/90 sm:text-base">
                    <span className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-rose-200 text-[11px] font-black text-rose-700">-</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>

            <article className="rounded-3xl border border-emerald-100 bg-emerald-50/70 p-7">
              <h3 className="text-2xl font-black text-emerald-900">Con Gestour</h3>
              <ul className="mt-5 space-y-3">
                {WITH_GESTOUR.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-emerald-900 sm:text-base">
                    <span className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-200 text-[11px] font-black text-emerald-700">+</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
          </div>
        </div>
      </section>

      <section id="funcionalidades" className="section-band py-16 scroll-mt-28 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-600 sm:text-sm">Funcionalidades</p>
            <h2 className="mt-3 text-3xl font-black text-slate-950 sm:text-5xl">Todo lo que tu agencia necesita para vender tours online</h2>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <article key={feature.title} className="feature-card rounded-2xl border border-emerald-100 bg-white p-7 shadow-sm">
                <span className="icon-pill mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl text-emerald-700">
                  <IconBadge icon={feature.icon} />
                </span>
                <h3 className="text-lg font-black text-emerald-900">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{feature.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="no-es-solo-una-web" className="bg-white py-16 scroll-mt-28 sm:py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 sm:p-10">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-600 sm:text-sm">Posicionamiento</p>
            <h2 className="mt-3 text-3xl font-black text-slate-950 sm:text-5xl">Tu agencia no necesita solo una página web</h2>
            <p className="mt-5 text-base leading-relaxed text-slate-600 sm:text-lg">
              Necesita una forma más clara, profesional y ordenada de mostrar sus tours, recibir interesados
              y acompañar al cliente desde la consulta hasta la reserva.
            </p>

            <div className="mt-6 rounded-2xl border border-emerald-200 bg-white p-5">
              <p className="text-base font-black text-emerald-900 sm:text-lg">
                Gestour está pensado específicamente para agencias de turismo, no como una web genérica.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="proceso" className="bg-white py-16 scroll-mt-28 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-600 sm:text-sm">Proceso</p>
            <h2 className="mt-3 text-3xl font-black text-slate-950 sm:text-5xl">¿Cómo empezamos?</h2>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {PROCESS_STEPS.map((step) => (
              <article key={step.n} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-4xl font-black leading-none text-emerald-200">{step.n}</p>
                <h3 className="mt-4 text-lg font-black text-slate-900">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{step.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="personalizacion" className="ideal-band py-16 scroll-mt-28 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 text-white sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-200 sm:text-sm">Personalización</p>
            <h2 className="mt-3 text-3xl font-black sm:text-5xl">La demo es solo el punto de partida</h2>
            <p className="mt-4 text-emerald-100/90 sm:text-lg">
              Tu web se adapta a la identidad de tu agencia. Podemos configurar tu logo, colores, imágenes,
              textos, tours, precios, WhatsApp, formularios y datos de contacto.
            </p>
          </div>

          <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {CUSTOMIZATION_CHIPS.map((chip) => (
              <div key={chip} className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-center text-sm font-semibold text-emerald-50 backdrop-blur-sm">
                {chip}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="cta-intermedio" className="section-band py-16 scroll-mt-28 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="rounded-3xl border border-emerald-200 bg-white p-8 text-center shadow-sm sm:p-10">
            <h2 className="text-3xl font-black text-slate-950 sm:text-5xl">Mira cómo podría verse tu agencia vendiendo tours online</h2>
            <p className="mx-auto mt-4 max-w-3xl text-base text-slate-600 sm:text-lg">
              Entra a la demo, navega el flujo completo y visualiza cómo tus clientes podrían consultar o reservar desde tu propia web.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3 sm:gap-4">
              <Link
                href={DEMO_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex w-full items-center justify-center rounded-xl bg-emerald-500 px-6 py-3 text-base font-black text-white transition hover:bg-emerald-400 sm:w-auto sm:px-8 sm:py-4"
              >
                Ver demo interactiva
              </Link>
              <FormAnchorLink className="inline-flex w-full items-center justify-center rounded-xl border border-emerald-200 bg-white px-6 py-3 text-base font-black text-emerald-900 transition hover:bg-emerald-50 sm:w-auto sm:px-8 sm:py-4">
                Solicitar propuesta
              </FormAnchorLink>
            </div>
          </div>
        </div>
      </section>

      <section id="formulario-contacto" className="bg-emerald-950 py-16 text-white scroll-mt-28 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-300 sm:text-sm">Formulario de contacto</p>
            <h2 className="mt-3 text-3xl font-black sm:text-5xl">Solicita una propuesta para tu agencia</h2>
            <p className="mt-4 text-base text-emerald-100/85 sm:text-lg">
              Cuéntanos sobre tu agencia y te mostramos cómo Gestour puede adaptarse a tus tours,
              proceso de reserva y forma de vender.
            </p>
          </div>

          <LandingLeadForm />
        </div>
      </section>

      <section id="faq" className="bg-white py-16 scroll-mt-28 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-600 sm:text-sm">FAQ</p>
            <h2 className="mt-3 text-3xl font-black text-slate-950 sm:text-5xl">Preguntas frecuentes</h2>
          </div>

          <div className="mt-12 grid gap-4">
            {FAQS.map((faq) => (
              <details key={faq.q} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <summary className="cursor-pointer text-lg font-black text-slate-900">{faq.q}</summary>
                <p className="mt-3 leading-relaxed text-slate-600">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-emerald-950 py-16 text-white sm:py-24">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <h2 className="text-3xl font-black leading-tight sm:text-5xl">
            Convierte tu agencia en una experiencia digital más profesional
          </h2>
          <p className="mx-auto mt-4 max-w-3xl text-base text-emerald-100/85 sm:text-lg">
            Explora la demo o solicita una propuesta para ver cómo Gestour puede ayudarte a mostrar tus tours,
            recibir interesados y vender de forma más ordenada.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3 sm:gap-4">
            <Link
              href={DEMO_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex w-full items-center justify-center rounded-xl bg-white px-6 py-3 text-base font-black text-emerald-900 transition hover:bg-emerald-100 sm:w-auto sm:px-8 sm:py-4"
            >
              Ver demo interactiva
            </Link>
            <FormAnchorLink className="inline-flex w-full items-center justify-center rounded-xl border border-white/35 bg-white/10 px-6 py-3 text-base font-black text-white transition hover:bg-white/20 sm:w-auto sm:px-8 sm:py-4">
              Solicitar propuesta
            </FormAnchorLink>
          </div>
        </div>
      </section>
    </div>
  );
}
