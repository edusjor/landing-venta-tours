import { headers } from 'next/headers';
import Link from 'next/link';
import ContactUnifiedForm from '../components/ContactUnifiedForm';
import { resolvePublicAgencyFromHeaders } from '../../lib/publicAgency';

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.86 19.86 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.86 19.86 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.33 1.78.63 2.62a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.46-1.2a2 2 0 0 1 2.11-.45c.84.3 1.72.51 2.62.63A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}

function MapPinIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 1 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20" />
      <path d="M12 2a15 15 0 0 1 0 20" />
      <path d="M12 2a15 15 0 0 0 0 20" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 2 4 5v6c0 5 3.4 9.7 8 11 4.6-1.3 8-6 8-11V5l-8-3z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function buildWhatsAppHref(value: string | null | undefined): string {
  const digits = String(value ?? '').replace(/\D+/g, '');
  return digits ? `https://wa.me/${digits}` : 'https://wa.me/';
}

export default async function ContactoPage() {
  const publicAgency = await resolvePublicAgencyFromHeaders(await headers());
  const agencyName = publicAgency?.name
    || String(process.env.PLATFORM_DEFAULT_AGENCY_NAME ?? process.env.DEFAULT_AGENCY_NAME ?? 'Agencia de Tours').trim()
    || 'Agencia de Tours';
  const agencyDescription = publicAgency?.description
    || String(process.env.PLATFORM_DEFAULT_AGENCY_DESCRIPTION ?? 'Atención directa para coordinar tours, fechas y pagos.').trim()
    || 'Atención directa para coordinar tours, fechas y pagos.';
  const agencyPhone = publicAgency?.phone
    || String(process.env.PLATFORM_DEFAULT_AGENCY_PHONE ?? '').trim()
    || 'No disponible';
  const agencyEmail = publicAgency?.email
    || String(process.env.PLATFORM_DEFAULT_AGENCY_EMAIL ?? process.env.CONTACT_TO_EMAIL ?? process.env.SMTP_USER ?? '').trim()
    || 'No disponible';
  const agencyWhatsApp = publicAgency?.whatsapp
    || String(process.env.PLATFORM_DEFAULT_AGENCY_WHATSAPP ?? process.env.PLATFORM_DEFAULT_AGENCY_PHONE ?? '').trim()
    || agencyPhone;

  return (
    <div>
      <section className="jungle-band py-12 text-white">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-4xl font-extrabold">Contáctanos directamente</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <article className="rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-sm">
              <h3 className="text-2xl font-extrabold">Canales de atención</h3>
              <div className="mt-4 space-y-3 text-sm font-semibold text-emerald-50">
                <p className="flex items-center gap-2"><PhoneIcon /> {agencyPhone}</p>
                <p className="flex items-center gap-2"><MailIcon /> {agencyEmail}</p>
                <p className="flex items-center gap-2"><ClockIcon /> Lunes a Viernes, 8:00 am a 5:00 pm</p>
                <p className="flex items-center gap-2"><MapPinIcon /> {agencyDescription}</p>
              </div>
            </article>

            <article className="rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-sm">
              <h3 className="text-2xl font-extrabold">{agencyName}</h3>
              <p className="mt-3 text-emerald-50">
                Escríbenos al {agencyWhatsApp} y te ayudamos a elegir tour, fechas y método de pago en minutos.
              </p>
              <a
                href={buildWhatsAppHref(agencyWhatsApp)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-block rounded-lg bg-amber-400 px-5 py-2 text-sm font-extrabold text-slate-900 transition hover:bg-amber-300"
              >
                Abrir WhatsApp
              </a>
            </article>
          </div>
        </div>
      </section>

      <section id="centro-contacto" className="bg-white py-12">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-3xl font-extrabold text-emerald-900">Listo para planear tu aventura</h2>
          <div className="mt-6 grid gap-6 lg:grid-cols-[1.35fr_0.85fr]">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
              <ContactUnifiedForm className="grid gap-4 md:grid-cols-2" />
            </div>

            <aside className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="h-56 w-full bg-[linear-gradient(135deg,#064e3b_0%,#0f766e_48%,#f59e0b_100%)]" style={{ backgroundImage: publicAgency?.coverImageUrl ? `linear-gradient(135deg, rgba(6,78,59,.8) 0%, rgba(15,118,110,.72) 48%, rgba(245,158,11,.42) 100%), url(${publicAgency.coverImageUrl})` : undefined, backgroundSize: 'cover', backgroundPosition: 'center' }} />
              <div className="space-y-2 p-4 text-sm text-slate-700">
                <p className="flex items-center gap-2"><MapPinIcon /> {agencyName}</p>
                <p className="flex items-center gap-2"><ShieldIcon /> Operadores certificados y respaldo local</p>
                <p className="flex items-center gap-2"><GlobeIcon /> {agencyDescription}</p>
                <Link href="/contacto" className="mt-2 inline-block font-extrabold text-emerald-700">Ver contacto completo</Link>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </div>
  );
}
