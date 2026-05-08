"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { DEMO_TOURS } from "../../../lib/demoTours";

function formatMoney(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function DemoToursPage() {
  const [search, setSearch] = useState("");
  const [country, setCountry] = useState("Todos");
  const [category, setCategory] = useState("Todas");
  const [onlyFeatured, setOnlyFeatured] = useState(false);

  const ranges = useMemo(() => {
    const prices = DEMO_TOURS.map((tour) => tour.priceFrom);
    const days = DEMO_TOURS.map((tour) => tour.durationDays);
    return {
      minPrice: Math.min(...prices),
      maxPrice: Math.max(...prices),
      minDays: Math.min(...days),
      maxDays: Math.max(...days),
    };
  }, []);

  const [maxPrice, setMaxPrice] = useState(ranges.maxPrice);
  const [maxDays, setMaxDays] = useState(ranges.maxDays);

  const countries = useMemo(() => ["Todos", ...Array.from(new Set(DEMO_TOURS.map((tour) => tour.country)))], []);
  const categories = useMemo(() => ["Todas", ...Array.from(new Set(DEMO_TOURS.map((tour) => tour.category)))], []);

  const filteredTours = useMemo(() => {
    const term = search.toLowerCase().trim();
    return DEMO_TOURS.filter((tour) => {
      const matchSearch = !term
        || `${tour.title} ${tour.zone} ${tour.country} ${tour.category}`.toLowerCase().includes(term);
      const matchCountry = country === "Todos" || tour.country === country;
      const matchCategory = category === "Todas" || tour.category === category;
      const matchFeatured = !onlyFeatured || tour.featured;
      const matchPrice = tour.priceFrom <= maxPrice;
      const matchDays = tour.durationDays <= maxDays;
      return matchSearch && matchCountry && matchCategory && matchFeatured && matchPrice && matchDays;
    });
  }, [category, country, maxDays, maxPrice, onlyFeatured, search]);

  return (
    <div className="bg-slate-50 py-14">
      <section className="mx-auto max-w-6xl px-4">
        <div className="rounded-3xl bg-gradient-to-r from-emerald-900 to-emerald-700 p-8 text-white shadow-xl">
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-emerald-200">Flujo demo</p>
          <h1 className="mt-2 text-3xl font-black sm:text-4xl">1. Explorar tours y aplicar filtros</h1>
          <p className="mt-3 max-w-3xl text-emerald-100">
            Esta pantalla muestra como una agencia puede ofrecer catalogo con filtros reales antes de que el cliente entre al detalle.
          </p>
        </div>

        <div className="mt-8 grid gap-4 rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm md:grid-cols-2 lg:grid-cols-6">
          <label className="grid gap-2 text-sm font-semibold text-slate-700 lg:col-span-2">
            Buscar tour
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Ej: volcan, playa, cultural"
              className="rounded-xl border border-slate-200 px-3 py-2 outline-none ring-emerald-300 focus:ring"
            />
          </label>

          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            Pais
            <select
              value={country}
              onChange={(event) => setCountry(event.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-2 outline-none ring-emerald-300 focus:ring"
            >
              {countries.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            Categoria
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-2 outline-none ring-emerald-300 focus:ring"
            >
              {categories.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            Precio maximo
            <input
              type="range"
              min={ranges.minPrice}
              max={ranges.maxPrice}
              value={maxPrice}
              onChange={(event) => setMaxPrice(Number(event.target.value))}
            />
            <span className="text-xs text-slate-500">Hasta {formatMoney(maxPrice)}</span>
          </label>

          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            Duracion maxima
            <input
              type="range"
              min={ranges.minDays}
              max={ranges.maxDays}
              value={maxDays}
              onChange={(event) => setMaxDays(Number(event.target.value))}
            />
            <span className="text-xs text-slate-500">Hasta {maxDays} dia(s)</span>
          </label>

          <label className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={onlyFeatured}
              onChange={(event) => setOnlyFeatured(event.target.checked)}
            />
            Solo destacados
          </label>
        </div>

        <p className="mt-4 text-sm font-semibold text-slate-600">
          {filteredTours.length} tour(es) encontrados
        </p>

        <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filteredTours.map((tour) => (
            <article key={tour.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md">
              <img src={tour.image} alt={tour.title} className="h-44 w-full object-cover" />
              <div className="p-5">
                <div className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                  {tour.category}
                </div>
                <h2 className="mt-3 text-xl font-extrabold text-slate-900">{tour.title}</h2>
                <p className="mt-1 text-sm text-slate-500">{tour.zone}, {tour.country}</p>
                <p className="mt-3 text-sm text-slate-600">{tour.description}</p>
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-lg font-black text-emerald-700">Desde {formatMoney(tour.priceFrom)}</p>
                  <p className="text-xs font-semibold text-slate-500">{tour.durationDays} dia(s)</p>
                </div>
                <Link
                  href={`/demo/tours/${tour.slug}`}
                  className="mt-4 inline-block w-full rounded-xl bg-emerald-600 px-4 py-3 text-center font-extrabold text-white transition hover:bg-emerald-500"
                >
                  Ver tour
                </Link>
              </div>
            </article>
          ))}
        </div>

        {!filteredTours.length && (
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
            No hay resultados con esos filtros. Ajusta los controles para ver mas opciones.
          </div>
        )}
      </section>
    </div>
  );
}
