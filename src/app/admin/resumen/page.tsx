"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

type SummaryPayload = {
  summary: {
    totalTours: number;
    totalReservations: number;
    pendingReservations: number;
    manualPaymentsPendingReview: number;
  };
  recentReservations: Array<{
    id: number;
    status: string;
    date: string;
    createdAt: string;
    people: number;
    paymentMethod: string | null;
    totalAmount: number | null;
    tour: {
      id: number;
      title: string;
    } | null;
  }>;
};

function formatDate(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleString("es-CR");
}

function formatUsd(value: unknown): string {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return "N/D";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(amount);
}

function statusLabel(status: string): string {
  const normalized = String(status ?? "").trim().toUpperCase();
  if (normalized === "PENDING") return "Pendiente pasarela";
  if (normalized === "PENDING_PAYMENT") return "Pendiente pago manual";
  if (normalized === "PAYMENT_REVIEW") return "Pago manual en revisión";
  if (normalized === "CONFIRMED") return "Confirmada";
  if (normalized === "REJECTED") return "Rechazada";
  if (normalized === "CANCELLED") return "Cancelada";
  return normalized || "-";
}

export default function AdminDashboardSummaryPage() {
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string>("");
  const [data, setData] = useState<SummaryPayload | null>(null);

  useEffect(() => {
    fetch("/api/admin/auth")
      .then((res) => setIsAuthenticated(res.ok))
      .catch(() => setIsAuthenticated(false))
      .finally(() => setIsAuthChecking(false));
  }, []);

  const loadSummary = async () => {
    setLoading(true);
    setFeedback("");

    try {
      const res = await fetch("/api/admin/dashboard-summary");
      if (res.status === 401 || res.status === 403 || res.status === 423) {
        setIsAuthenticated(false);
        setData(null);
        return;
      }

      const payload = (await res.json().catch(() => null)) as SummaryPayload | null;
      if (!res.ok || !payload) {
        setFeedback("No se pudo cargar el resumen de operación.");
        setData(null);
        return;
      }

      setData(payload);
    } catch {
      setFeedback("Error de red cargando el resumen.");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    void loadSummary();
  }, [isAuthenticated]);

  if (isAuthChecking) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-10">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold text-slate-600">Verificando sesión de administrador...</p>
        </div>
      </section>
    );
  }

  if (!isAuthenticated) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-10">
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center shadow-sm">
          <h1 className="text-2xl font-extrabold text-rose-800">Sesión requerida</h1>
          <p className="mt-2 text-sm font-semibold text-rose-700">Debes iniciar sesión como administrador para ver el resumen.</p>
          <Link href="/admin" className="mt-4 inline-flex rounded-lg bg-rose-700 px-4 py-2 text-sm font-bold text-white hover:bg-rose-600">
            Ir al login admin
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-6 rounded-3xl bg-gradient-to-r from-slate-900 via-emerald-800 to-teal-600 p-6 text-white shadow-xl shadow-slate-900/20">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-200">Operación diaria</p>
        <h1 className="mt-2 text-3xl font-black">Resumen de agencia</h1>
        <p className="mt-2 text-sm font-semibold text-emerald-50/90">Indicadores básicos filtrados por tu agencia.</p>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <Link href="/admin" className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
          Volver al panel
        </Link>
        <Link href="/admin/pedidos" className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-100">
          Ir a reservas
        </Link>
        <Link href="/admin/pagos-manuales" className="rounded-lg border border-violet-300 bg-violet-50 px-3 py-2 text-sm font-semibold text-violet-700 hover:bg-violet-100">
          Revisar pagos manuales
        </Link>
        <button
          type="button"
          onClick={() => void loadSummary()}
          className="rounded-lg bg-emerald-700 px-3 py-2 text-sm font-bold text-white hover:bg-emerald-600"
        >
          Actualizar
        </button>
      </div>

      {feedback ? <p className="mb-4 rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-700">{feedback}</p> : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Tours activos en catálogo</p>
          <p className="mt-2 text-3xl font-black text-slate-900">{data?.summary.totalTours ?? (loading ? "..." : 0)}</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Reservas totales</p>
          <p className="mt-2 text-3xl font-black text-slate-900">{data?.summary.totalReservations ?? (loading ? "..." : 0)}</p>
        </article>
        <article className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-700">Reservas pendientes</p>
          <p className="mt-2 text-3xl font-black text-amber-900">{data?.summary.pendingReservations ?? (loading ? "..." : 0)}</p>
        </article>
        <article className="rounded-2xl border border-violet-200 bg-violet-50 p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-700">Pagos manuales por revisar</p>
          <p className="mt-2 text-3xl font-black text-violet-900">{data?.summary.manualPaymentsPendingReview ?? (loading ? "..." : 0)}</p>
        </article>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h2 className="text-lg font-black text-slate-900">Reservas recientes</h2>
          <p className="text-xs font-semibold text-slate-500">Últimas 10</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-2 text-left font-bold text-slate-600">#</th>
                <th className="px-3 py-2 text-left font-bold text-slate-600">Tour</th>
                <th className="px-3 py-2 text-left font-bold text-slate-600">Estado</th>
                <th className="px-3 py-2 text-left font-bold text-slate-600">Método</th>
                <th className="px-3 py-2 text-left font-bold text-slate-600">Total</th>
                <th className="px-3 py-2 text-left font-bold text-slate-600">Creada</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center font-semibold text-slate-500">Cargando resumen...</td>
                </tr>
              ) : !data?.recentReservations?.length ? (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center font-semibold text-slate-500">Aún no hay reservas en esta agencia.</td>
                </tr>
              ) : (
                data.recentReservations.map((item) => (
                  <tr key={item.id}>
                    <td className="px-3 py-3 font-extrabold text-slate-800">#{item.id}</td>
                    <td className="px-3 py-3 text-slate-700">{item.tour?.title || "-"}</td>
                    <td className="px-3 py-3 text-slate-700">{statusLabel(item.status)}</td>
                    <td className="px-3 py-3 text-slate-700">{item.paymentMethod || "No indicado"}</td>
                    <td className="px-3 py-3 font-bold text-emerald-800">{formatUsd(item.totalAmount)}</td>
                    <td className="px-3 py-3 text-slate-600">{formatDate(item.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
