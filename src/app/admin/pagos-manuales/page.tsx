"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type ReservationStatus = "PENDING_PAYMENT" | "PAYMENT_REVIEW" | "CONFIRMED" | "REJECTED" | "CANCELLED";
type ManualStatusFilter = "pending" | "pending_payment" | "payment_review" | "rejected" | "confirmed";

type ReservationItem = {
  id: number;
  status: ReservationStatus;
  paymentMethod: string | null;
  paymentReviewNote: string | null;
  manualPaymentProofUrl: string | null;
  name: string;
  lastName: string | null;
  email: string;
  date: string;
  people: number;
  tour: {
    title: string;
  };
  totalAmount?: number | null;
};

const statusLabel: Record<ReservationStatus, string> = {
  PENDING_PAYMENT: "Pendiente de pago manual",
  PAYMENT_REVIEW: "Pago en revisión",
  CONFIRMED: "Pago manual aprobado",
  REJECTED: "Pago rechazado",
  CANCELLED: "Reserva cancelada",
};

function formatDateLong(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  const day = new Intl.DateTimeFormat("es-CR", { day: "numeric", timeZone: "UTC" }).format(date);
  const month = new Intl.DateTimeFormat("es-CR", { month: "long", timeZone: "UTC" }).format(date);
  const year = new Intl.DateTimeFormat("es-CR", { year: "numeric", timeZone: "UTC" }).format(date);
  return `${day} ${month}, ${year}`;
}

function formatPriceDetail(value: unknown): string {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return "N/D";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(amount);
}

export default function AdminManualPaymentsPage() {
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [updatingReservationId, setUpdatingReservationId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [statusFilter, setStatusFilter] = useState<ManualStatusFilter>("pending");
  const [reservations, setReservations] = useState<ReservationItem[]>([]);
  const [notesDraft, setNotesDraft] = useState<Record<number, string>>({});

  useEffect(() => {
    fetch("/api/admin/auth")
      .then((res) => setIsAuthenticated(res.ok))
      .catch(() => setIsAuthenticated(false))
      .finally(() => setIsAuthChecking(false));
  }, []);

  const loadReservations = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({ payment: "manual", status: statusFilter, sortBy: "createdAt", order: "desc" });
      const res = await fetch(`/api/admin/reservations?${query.toString()}`);
      if (res.status === 401) {
        setIsAuthenticated(false);
        setReservations([]);
        setFeedback({ type: "error", message: "Sesión expirada. Inicia sesión nuevamente." });
        return;
      }

      const payload = await res.json().catch(() => null);
      if (!res.ok) {
        setReservations([]);
        setFeedback({ type: "error", message: payload?.error || "No se pudieron cargar los pagos manuales." });
        return;
      }

      const nextReservations = Array.isArray(payload?.reservations) ? (payload.reservations as ReservationItem[]) : [];
      setReservations(nextReservations);
      setNotesDraft((prev) => {
        const next = { ...prev };
        nextReservations.forEach((item) => {
          if (typeof next[item.id] !== "string") {
            next[item.id] = item.paymentReviewNote || "";
          }
        });
        return next;
      });
      setFeedback(null);
    } catch {
      setFeedback({ type: "error", message: "Error de red al cargar pagos manuales." });
      setReservations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    void loadReservations();
  }, [isAuthenticated, statusFilter]);

  const updateStatus = async (reservationId: number, status: ReservationStatus) => {
    setUpdatingReservationId(reservationId);
    try {
      const res = await fetch("/api/admin/reservations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reservationId,
          status,
          paymentReviewNote: notesDraft[reservationId] ?? null,
        }),
      });

      const payload = await res.json().catch(() => null);
      if (!res.ok) {
        setFeedback({ type: "error", message: payload?.error || `No se pudo actualizar la reserva #${reservationId}.` });
        return;
      }

      setFeedback({ type: "success", message: `Reserva #${reservationId} actualizada a ${statusLabel[status]}.` });
      await loadReservations();
    } catch {
      setFeedback({ type: "error", message: `Error de red actualizando la reserva #${reservationId}.` });
    } finally {
      setUpdatingReservationId(null);
    }
  };

  const totalPending = useMemo(
    () => reservations.filter((item) => item.status === "PENDING_PAYMENT" || item.status === "PAYMENT_REVIEW").length,
    [reservations],
  );

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
          <p className="mt-2 text-sm font-semibold text-rose-700">Debes iniciar sesión como administrador para revisar pagos manuales.</p>
          <Link href="/admin" className="mt-4 inline-flex rounded-lg bg-rose-700 px-4 py-2 text-sm font-bold text-white hover:bg-rose-600">
            Ir al login admin
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-6 rounded-3xl bg-gradient-to-r from-slate-900 via-violet-900 to-fuchsia-800 p-6 text-white shadow-xl shadow-violet-950/20">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-violet-200">Backoffice de cobros</p>
        <h1 className="mt-2 text-3xl font-black">Revisión de pagos manuales</h1>
        <p className="mt-2 text-sm font-semibold text-violet-100">Aprueba o rechaza transferencias por agencia y documenta la revisión interna.</p>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <Link href="/admin" className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
          Volver al panel
        </Link>
        <Link href="/admin/pagos" className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100">
          Configuración de pagos
        </Link>
        <Link href="/admin/pedidos" className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
          Ver todas las reservas
        </Link>
        <label className="text-sm font-semibold text-slate-700">Filtrar estado</label>
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as ManualStatusFilter)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
        >
          <option value="pending">Pendientes de revisión</option>
          <option value="pending_payment">Pendiente de pago manual</option>
          <option value="payment_review">Pago en revisión</option>
          <option value="rejected">Rechazadas</option>
          <option value="confirmed">Aprobadas</option>
        </select>
        <button type="button" onClick={() => void loadReservations()} className="rounded-lg bg-violet-700 px-3 py-2 text-sm font-bold text-white hover:bg-violet-600">
          Actualizar
        </button>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-700">En cola</p>
          <p className="mt-1 text-2xl font-black text-violet-900">{totalPending}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:col-span-3">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Registros cargados</p>
          <p className="mt-1 text-2xl font-black text-slate-900">{reservations.length}</p>
        </div>
      </div>

      {feedback ? (
        <p className={`mb-4 rounded-xl p-3 text-sm font-semibold ${feedback.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
          {feedback.message}
        </p>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-2 text-left font-bold text-slate-600">Reserva</th>
                <th className="px-3 py-2 text-left font-bold text-slate-600">Cliente</th>
                <th className="px-3 py-2 text-left font-bold text-slate-600">Tour</th>
                <th className="px-3 py-2 text-left font-bold text-slate-600">Total</th>
                <th className="px-3 py-2 text-left font-bold text-slate-600">Estado</th>
                <th className="px-3 py-2 text-left font-bold text-slate-600">Comprobante</th>
                <th className="px-3 py-2 text-left font-bold text-slate-600">Revisión</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center font-semibold text-slate-500">Cargando pagos manuales...</td>
                </tr>
              ) : reservations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center font-semibold text-slate-500">No hay pagos manuales con el filtro seleccionado.</td>
                </tr>
              ) : (
                reservations.map((item) => (
                  <tr key={item.id}>
                    <td className="px-3 py-3 text-slate-700">
                      <p className="font-extrabold text-slate-900">#{item.id}</p>
                      <p>{formatDateLong(item.date)}</p>
                      <p className="text-xs text-slate-500">{item.people} personas</p>
                    </td>
                    <td className="px-3 py-3 text-slate-700">
                      <p className="font-semibold text-slate-900">{[item.name, item.lastName].filter(Boolean).join(" ")}</p>
                      <p>{item.email}</p>
                    </td>
                    <td className="px-3 py-3 text-slate-700">
                      <p className="font-semibold text-slate-900">{item.tour?.title || "-"}</p>
                      <p className="text-xs text-slate-500">{item.paymentMethod || "Manual"}</p>
                    </td>
                    <td className="px-3 py-3 font-extrabold text-emerald-800">{formatPriceDetail(item.totalAmount)}</td>
                    <td className="px-3 py-3 text-slate-700">
                      <span className="inline-flex rounded-full bg-violet-50 px-2 py-1 text-xs font-bold text-violet-700">{statusLabel[item.status]}</span>
                    </td>
                    <td className="px-3 py-3 text-slate-700">
                      {item.manualPaymentProofUrl ? (
                        <a href={item.manualPaymentProofUrl} target="_blank" rel="noreferrer" className="inline-flex rounded-lg border border-violet-300 bg-violet-50 px-3 py-1 text-xs font-bold text-violet-700 hover:bg-violet-100">
                          Ver comprobante
                        </a>
                      ) : (
                        <span className="text-xs text-slate-500">Sin comprobante</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-slate-700">
                      <textarea
                        rows={2}
                        value={notesDraft[item.id] ?? ""}
                        onChange={(event) => setNotesDraft((prev) => ({ ...prev, [item.id]: event.target.value }))}
                        className="w-full rounded-lg border border-slate-300 px-2 py-1 text-xs"
                        placeholder="Nota interna opcional"
                      />
                      <div className="mt-2 flex flex-wrap gap-1">
                        <button
                          type="button"
                          disabled={updatingReservationId === item.id}
                          onClick={() => void updateStatus(item.id, "PAYMENT_REVIEW")}
                          className="rounded-lg border border-violet-300 bg-violet-50 px-2 py-1 text-xs font-bold text-violet-700 hover:bg-violet-100 disabled:opacity-50"
                        >
                          Revisar
                        </button>
                        <button
                          type="button"
                          disabled={updatingReservationId === item.id}
                          onClick={() => void updateStatus(item.id, "CONFIRMED")}
                          className="rounded-lg bg-emerald-700 px-2 py-1 text-xs font-bold text-white hover:bg-emerald-600 disabled:bg-slate-300"
                        >
                          Aprobar
                        </button>
                        <button
                          type="button"
                          disabled={updatingReservationId === item.id}
                          onClick={() => void updateStatus(item.id, "REJECTED")}
                          className="rounded-lg border border-rose-300 bg-rose-50 px-2 py-1 text-xs font-bold text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                        >
                          Rechazar
                        </button>
                      </div>
                    </td>
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
