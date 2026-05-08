"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { getDemoTourBySlug } from "../../../../../lib/demoTours";

type PaymentMethod = "tarjeta" | "deposito" | "reserva";

function formatMoney(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function DemoPaymentPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = typeof params?.slug === "string" ? params.slug : "";
  const date = String(searchParams?.get("fecha") ?? "").trim();
  const tour = useMemo(() => getDemoTourBySlug(slug), [slug]);

  const [people, setPeople] = useState(2);
  const [method, setMethod] = useState<PaymentMethod>("tarjeta");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [done, setDone] = useState(false);

  if (!tour || !date) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-800">
          Falta informacion de la demo. Debes elegir tour y fecha primero.
        </div>
        <Link href="/demo/tours" className="mt-5 inline-block rounded-xl bg-emerald-600 px-4 py-3 font-bold text-white">
          Ir al catalogo demo
        </Link>
      </div>
    );
  }

  const total = people * tour.priceFrom;
  const dateLabel = new Date(`${date}T00:00:00`).toLocaleDateString("es-ES", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  if (done) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20">
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-8 text-center">
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-emerald-700">4. Pago demo</p>
          <h1 className="mt-2 text-4xl font-black text-emerald-900">Solicitud enviada en modo demo</h1>
          <p className="mt-4 text-slate-700">
            Se simulo el flujo completo: tour + fecha + pago. Este cierre sirve para mostrar la experiencia al cliente.
          </p>
          <p className="mt-4 rounded-xl bg-white p-3 text-sm font-semibold text-slate-700">
            Referencia demo: DEMO-{tour.id}-{Date.now().toString().slice(-6)}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/demo/tours" className="rounded-xl border border-emerald-300 px-4 py-3 font-bold text-emerald-800">
              Volver al catalogo
            </Link>
            <Link href="/#formulario-contacto" className="rounded-xl bg-emerald-600 px-5 py-3 font-extrabold text-white">
              Quiero este sistema para mi agencia
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 py-14">
      <section className="mx-auto grid max-w-6xl gap-6 px-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 lg:col-span-2">
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-emerald-600">4. Pago demo</p>
          <h1 className="mt-2 text-3xl font-black text-slate-900">Finalizar reserva</h1>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              Nombre completo
              <input
                required
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                className="rounded-xl border border-slate-200 px-3 py-2 outline-none ring-emerald-300 focus:ring"
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              Correo electronico
              <input
                required
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="rounded-xl border border-slate-200 px-3 py-2 outline-none ring-emerald-300 focus:ring"
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              WhatsApp
              <input
                required
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                className="rounded-xl border border-slate-200 px-3 py-2 outline-none ring-emerald-300 focus:ring"
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              Personas
              <input
                type="number"
                min={1}
                max={12}
                value={people}
                onChange={(event) => setPeople(Math.max(1, Number(event.target.value) || 1))}
                className="rounded-xl border border-slate-200 px-3 py-2 outline-none ring-emerald-300 focus:ring"
              />
            </label>
          </div>

          <div className="mt-6 grid gap-3">
            <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-slate-500">Metodo de pago demo</p>
            <button
              type="button"
              onClick={() => setMethod("tarjeta")}
              className={`rounded-xl border px-4 py-3 text-left font-semibold ${method === "tarjeta" ? "border-emerald-600 bg-emerald-50 text-emerald-800" : "border-slate-300 bg-white text-slate-700"}`}
            >
              Tarjeta online demo (aprobacion instantanea)
            </button>
            <button
              type="button"
              onClick={() => setMethod("deposito")}
              className={`rounded-xl border px-4 py-3 text-left font-semibold ${method === "deposito" ? "border-emerald-600 bg-emerald-50 text-emerald-800" : "border-slate-300 bg-white text-slate-700"}`}
            >
              Deposito demo (comprobante pendiente)
            </button>
            <button
              type="button"
              onClick={() => setMethod("reserva")}
              className={`rounded-xl border px-4 py-3 text-left font-semibold ${method === "reserva" ? "border-emerald-600 bg-emerald-50 text-emerald-800" : "border-slate-300 bg-white text-slate-700"}`}
            >
              Solo solicitud de reserva demo
            </button>
          </div>

          <button
            type="button"
            disabled={!fullName.trim() || !email.trim() || !phone.trim()}
            onClick={() => setDone(true)}
            className={`mt-7 w-full rounded-xl px-5 py-4 text-lg font-extrabold text-white ${fullName.trim() && email.trim() && phone.trim() ? "bg-emerald-600 hover:bg-emerald-500" : "cursor-not-allowed bg-slate-400"}`}
          >
            Simular pago y confirmar
          </button>
        </div>

        <aside className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black text-slate-900">Resumen</h2>
          <div className="mt-4 grid gap-2 text-sm text-slate-700">
            <p><span className="font-bold">Tour:</span> {tour.title}</p>
            <p><span className="font-bold">Fecha:</span> {dateLabel}</p>
            <p><span className="font-bold">Personas:</span> {people}</p>
            <p><span className="font-bold">Metodo:</span> {method}</p>
          </div>
          <p className="mt-5 text-sm font-semibold text-slate-500">Total estimado</p>
          <p className="text-3xl font-black text-emerald-700">{formatMoney(total)}</p>

          <Link
            href={`/demo/tours/${tour.slug}`}
            className="mt-6 inline-block w-full rounded-xl border border-slate-300 px-4 py-3 text-center font-bold text-slate-700"
          >
            Cambiar fecha
          </Link>
        </aside>
      </section>
    </div>
  );
}
