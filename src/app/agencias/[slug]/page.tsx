import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "../../../lib/prisma";

const TOUR_PLACEHOLDER_IMAGE = "/tour-placeholder.svg";

function buildTourRouteParam(tour: { id: number; slug: string }): string {
  const slug = String(tour.slug ?? "").trim();
  if (slug) return slug;
  return String(tour.id);
}

function buildTourHref(agencySlug: string, tour: { id: number; slug: string }): string {
  return `/tours/${encodeURIComponent(buildTourRouteParam(tour))}?agency=${encodeURIComponent(agencySlug)}`;
}

export default async function AgencyProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const agency = await prisma.agency.findFirst({
    where: {
      slug,
      status: "ACTIVE",
    },
    select: {
      id: true,
      name: true,
      slug: true,
      email: true,
      phone: true,
      whatsapp: true,
      logoUrl: true,
      coverImageUrl: true,
      description: true,
      tours: {
        where: {
          status: "ACTIVO",
          isDeleted: false,
        },
        orderBy: [
          { featured: "desc" },
          { createdAt: "desc" },
        ],
        take: 6,
        select: {
          id: true,
          title: true,
          slug: true,
          description: true,
          images: true,
          featured: true,
          price: true,
          zone: true,
          country: true,
          category: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  if (!agency) {
    notFound();
  }

  const coverImage = agency.coverImageUrl || agency.logoUrl || TOUR_PLACEHOLDER_IMAGE;
  const visibleTours = agency.tours;

  return (
    <section className="bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.16),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(245,158,11,0.18),transparent_30%),linear-gradient(180deg,#f8fbfa_0%,#eef5f2_100%)] pb-14">
      <div
        className="relative overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(120deg, rgba(5,46,22,0.82), rgba(15,118,110,0.62)), url(${coverImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-16 text-white md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <p className="inline-flex rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-[0.2em] text-emerald-50">
              Agencia asociada
            </p>
            <div className="mt-4 flex items-center gap-4">
              <img
                src={agency.logoUrl || TOUR_PLACEHOLDER_IMAGE}
                alt={agency.name}
                className="h-20 w-20 rounded-3xl border border-white/30 bg-white/90 object-cover shadow-2xl"
              />
              <div>
                <h1 className="text-4xl font-black md:text-5xl">{agency.name}</h1>
                <p className="mt-2 max-w-2xl text-sm font-semibold text-emerald-50/90 md:text-base">
                  {agency.description || "Perfil público de agencia dentro del sistema multiagencia."}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-2 rounded-3xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm md:min-w-[280px]">
            {agency.email && <p className="text-sm font-semibold">Correo: {agency.email}</p>}
            {agency.phone && <p className="text-sm font-semibold">Teléfono: {agency.phone}</p>}
            {agency.whatsapp && <p className="text-sm font-semibold">WhatsApp: {agency.whatsapp}</p>}
            {!agency.email && !agency.phone && !agency.whatsapp && (
              <p className="text-sm font-semibold text-emerald-50/85">Esta agencia aún no ha configurado datos de contacto públicos.</p>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto mt-8 max-w-6xl px-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-700">Tours de la agencia</p>
            <h2 className="mt-1 text-3xl font-black text-slate-900">Experiencias publicadas</h2>
          </div>
          <Link
            href={`/agencias/${encodeURIComponent(agency.slug)}/tours`}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-black text-white transition hover:bg-slate-800"
          >
            Ver todos los tours
          </Link>
        </div>

        {visibleTours.length > 0 ? (
          <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {visibleTours.map((tour) => {
              const image = Array.isArray(tour.images) && tour.images[0] ? tour.images[0] : TOUR_PLACEHOLDER_IMAGE;
              const location = [tour.zone, tour.country].map((item) => String(item ?? "").trim()).filter(Boolean).join(", ");

              return (
                <article key={tour.id} className="flex flex-col overflow-hidden rounded-3xl border border-white/70 bg-white/95 shadow-[0_18px_45px_rgba(15,23,42,0.12)] backdrop-blur-sm">
                  <div className="relative">
                    <img src={image} alt={tour.title} className="h-52 w-full object-cover" />
                    {tour.featured && (
                      <span className="absolute left-4 top-4 rounded-full bg-amber-400 px-3 py-1 text-xs font-black uppercase tracking-wide text-slate-900">
                        Destacado
                      </span>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">{tour.category?.name ?? "Tour"}</p>
                    <h3 className="mt-2 text-xl font-black text-slate-900">{tour.title}</h3>
                    <p className="mt-2 line-clamp-3 text-sm font-medium leading-6 text-slate-600">{tour.description}</p>
                    {location && (
                      <p className="mt-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">{location}</p>
                    )}

                    <div className="mt-auto flex items-center justify-between gap-3 pt-5">
                      <span className="text-2xl font-black text-emerald-700">${tour.price.toFixed(2)}</span>
                      <Link
                        href={buildTourHref(agency.slug, { id: tour.id, slug: tour.slug })}
                        className="rounded-xl bg-amber-400 px-4 py-2 text-sm font-black text-slate-900 transition hover:bg-amber-300"
                      >
                        Ver tour
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 text-sm font-semibold text-slate-600 shadow-sm">
            Esta agencia todavía no tiene tours públicos activos.
          </div>
        )}
      </div>
    </section>
  );
}