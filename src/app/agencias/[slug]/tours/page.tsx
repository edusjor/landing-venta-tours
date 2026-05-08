import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "../../../../lib/prisma";

const TOUR_PLACEHOLDER_IMAGE = "/tour-placeholder.svg";

function buildTourRouteParam(tour: { id: number; slug: string }): string {
  const slug = String(tour.slug ?? "").trim();
  if (slug) return slug;
  return String(tour.id);
}

export default async function AgencyToursPage({
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
      slug: true,
      name: true,
      tours: {
        where: {
          status: "ACTIVO",
          isDeleted: false,
        },
        orderBy: [
          { featured: "desc" },
          { createdAt: "desc" },
        ],
        select: {
          id: true,
          slug: true,
          title: true,
          description: true,
          images: true,
          price: true,
          zone: true,
          country: true,
          featured: true,
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

  return (
    <section className="mx-auto max-w-7xl px-4 py-10">
      <div className="rounded-3xl bg-gradient-to-r from-emerald-900 via-emerald-700 to-teal-600 px-6 py-8 text-white shadow-xl shadow-emerald-950/20">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-100">Storefront por agencia</p>
        <h1 className="mt-2 text-4xl font-black">Tours de {agency.name}</h1>
        <p className="mt-2 max-w-2xl text-sm font-semibold text-emerald-50/90">
          Vista pública filtrada solo con tours pertenecientes a esta agencia.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href={`/agencias/${encodeURIComponent(agency.slug)}`}
            className="rounded-xl bg-white/15 px-4 py-2 text-sm font-black text-white transition hover:bg-white/25"
          >
            Ver perfil
          </Link>
          <Link
            href={`/tours?agency=${encodeURIComponent(agency.slug)}`}
            className="rounded-xl bg-white px-4 py-2 text-sm font-black text-slate-900 transition hover:bg-emerald-50"
          >
            Abrir vista global filtrada
          </Link>
        </div>
      </div>

      {agency.tours.length > 0 ? (
        <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {agency.tours.map((tour) => {
            const image = Array.isArray(tour.images) && tour.images[0] ? tour.images[0] : TOUR_PLACEHOLDER_IMAGE;
            const location = [tour.zone, tour.country].map((item) => String(item ?? "").trim()).filter(Boolean).join(", ");

            return (
              <article key={tour.id} className="flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.11)]">
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
                  <h2 className="mt-2 text-xl font-black text-slate-900">{tour.title}</h2>
                  <p className="mt-2 line-clamp-3 text-sm font-medium leading-6 text-slate-600">{tour.description}</p>
                  {location && (
                    <p className="mt-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">{location}</p>
                  )}

                  <div className="mt-auto flex items-center justify-between gap-3 pt-5">
                    <span className="text-2xl font-black text-emerald-700">${tour.price.toFixed(2)}</span>
                    <Link
                      href={`/tours/${encodeURIComponent(buildTourRouteParam(tour))}?agency=${encodeURIComponent(agency.slug)}`}
                      className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-black text-white transition hover:bg-slate-800"
                    >
                      Ver detalles
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 text-sm font-semibold text-slate-600 shadow-sm">
          Esta agencia no tiene tours públicos activos por ahora.
        </div>
      )}
    </section>
  );
}