"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { getDemoTourBySlug } from "../../../../lib/demoTours";

function formatMoney(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function DemoTourDetailPage() {
  const params = useParams();
  const slug = typeof params?.slug === "string" ? params.slug : "";
  const tour = useMemo(() => getDemoTourBySlug(slug), [slug]);
  const [selectedDate, setSelectedDate] = useState("");

  if (!tour) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
          Tour demo no encontrado.
        </div>
        <Link href="/demo/tours" className="mt-5 inline-block rounded-xl bg-emerald-600 px-4 py-3 font-bold text-white">
          Volver al catalogo demo
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white py-14">
      <section className="mx-auto max-w-6xl px-4">
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <img src={tour.image} alt={tour.title} className="h-80 w-full rounded-2xl object-cover shadow-md" />
          </div>

          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-emerald-600">2. Detalle del tour</p>
            <h1 className="mt-2 text-4xl font-black text-slate-900">{tour.title}</h1>
            <p className="mt-2 text-sm font-semibold text-slate-500">{tour.zone}, {tour.country}</p>
            <p className="mt-4 text-slate-700">{tour.description}</p>

            <div className="mt-5 grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
              <p><span className="font-bold">Categoria:</span> {tour.category}</p>
              <p><span className="font-bold">Duracion:</span> {tour.durationDays} dia(s)</p>
              <p><span className="font-bold">Dificultad:</span> {tour.difficulty}</p>
              <p><span className="font-bold">Precio base:</span> {formatMoney(tour.priceFrom)}</p>
            </div>

            <div className="mt-6 rounded-xl border border-emerald-100 bg-emerald-50 p-4">
              <p className="text-sm font-bold text-emerald-800">Incluye</p>
              <ul className="mt-2 grid gap-1 text-sm text-emerald-900">
                {tour.includes.map((item) => (
                  <li key={item}>- {item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-10 rounded-2xl border border-slate-200 bg-slate-50 p-6">
          <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-emerald-600">3. Elegir fecha</p>
          <h2 className="mt-2 text-2xl font-black text-slate-900">Selecciona una fecha disponible</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {tour.dates.map((date) => {
              const label = new Date(`${date}T00:00:00`).toLocaleDateString("es-ES", {
                weekday: "short",
                day: "2-digit",
                month: "short",
                year: "numeric",
              });
              const active = selectedDate === date;
              return (
                <button
                  key={date}
                  type="button"
                  onClick={() => setSelectedDate(date)}
                  className={`rounded-xl border px-4 py-3 text-left text-sm font-bold transition ${active ? "border-emerald-600 bg-emerald-600 text-white" : "border-slate-300 bg-white text-slate-700 hover:border-emerald-300"}`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link href="/demo/tours" className="rounded-xl border border-slate-300 px-4 py-3 font-bold text-slate-700">
              Volver a filtros
            </Link>
            <Link
              href={selectedDate ? `/demo/tours/${tour.slug}/pago?fecha=${encodeURIComponent(selectedDate)}` : "#"}
              aria-disabled={!selectedDate}
              className={`rounded-xl px-6 py-3 font-extrabold text-white ${selectedDate ? "bg-emerald-600 hover:bg-emerald-500" : "cursor-not-allowed bg-slate-400"}`}
            >
              Continuar a pago demo
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
