"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type ReservationStatus = "PENDING" | "PENDING_PAYMENT" | "PAYMENT_REVIEW" | "CONFIRMED" | "REJECTED" | "CANCELLED";
type PaymentFilter = "all" | "gateway" | "manual";
type StatusFilter = "all" | "pending" | "pending_payment" | "payment_review" | "confirmed" | "rejected" | "cancelled";
type SortBy = "createdAt" | "date";
type SortOrder = "asc" | "desc";

type ReservationItem = {
  id: number;
  status: ReservationStatus;
  paymentKind: "gateway" | "manual";
  paymentMethod: string | null;
  paymentReviewNote: string | null;
  manualPaymentProofUrl: string | null;
  tour: {
    id: number;
    title: string;
  };
  people: number;
  date: string;
  name: string;
  lastName: string | null;
  email: string;
  phone: string | null;
  hotel: string | null;
  scheduleTime: string | null;
  paid: boolean;
  createdAt: string;
  totalAmount?: number | null;
  packageTitle?: string | null;
  priceBreakdown?: Array<{
    id: string;
    name: string;
    quantity: number;
    totalPrice?: number;
  }>;
};

const statusLabels: Record<ReservationStatus, string> = {
  PENDING: "Pendiente de cobro en pasarela",
  PENDING_PAYMENT: "Pendiente de pago manual",
  PAYMENT_REVIEW: "Pago manual en revisión",
  CONFIRMED: "Confirmada",
  REJECTED: "Pago rechazado",
  CANCELLED: "Cancelada",
};

const statusBadgeClass: Record<ReservationStatus, string> = {
  PENDING: "bg-amber-50 text-amber-700",
  PENDING_PAYMENT: "bg-orange-50 text-orange-700",
  PAYMENT_REVIEW: "bg-violet-50 text-violet-700",
  CONFIRMED: "bg-emerald-50 text-emerald-700",
  REJECTED: "bg-rose-50 text-rose-700",
  CANCELLED: "bg-slate-200 text-slate-700",
};

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("es-CR");
}

function formatDateLong(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  const day = new Intl.DateTimeFormat("es-CR", { day: "numeric", timeZone: "UTC" }).format(date);
  const month = new Intl.DateTimeFormat("es-CR", { month: "long", timeZone: "UTC" }).format(date);
  const year = new Intl.DateTimeFormat("es-CR", { year: "numeric", timeZone: "UTC" }).format(date);
  return `${day} ${month}, ${year}`;
}

function formatScheduleLabel(value: string | null): string {
  const normalized = String(value ?? "").trim();
  if (!normalized || normalized.toLowerCase() === "por coordinar") return "Por coordinar";

  const timeMatch = /^(\d{1,2}):(\d{2})$/.exec(normalized);
  if (timeMatch) {
    const hours = Number(timeMatch[1]);
    const minutes = Number(timeMatch[2]);
    if (Number.isFinite(hours) && Number.isFinite(minutes) && hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
      const meridiem = hours >= 12 ? "p. m." : "a. m.";
      const hour12 = hours % 12 || 12;
      return `${hour12}:${String(minutes).padStart(2, "0")} ${meridiem}`;
    }
  }

  return normalized;
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

function normalizeReservationStatus(value: string): ReservationStatus {
  const normalized = String(value ?? "").trim().toUpperCase();
  if (normalized === "PENDING_PAYMENT") return "PENDING_PAYMENT";
  if (normalized === "PAYMENT_REVIEW") return "PAYMENT_REVIEW";
  if (normalized === "CONFIRMED") return "CONFIRMED";
  if (normalized === "REJECTED") return "REJECTED";
  if (normalized === "CANCELLED") return "CANCELLED";
  return "PENDING";
}

export default function AdminOrdersPage() {
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [sortBy, setSortBy] = useState<SortBy>("createdAt");
  const [order, setOrder] = useState<SortOrder>("desc");
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [updatingReservationId, setUpdatingReservationId] = useState<number | null>(null);
  const [reservations, setReservations] = useState<ReservationItem[]>([]);
  const [activeReservation, setActiveReservation] = useState<ReservationItem | null>(null);
  const [reviewNoteDraft, setReviewNoteDraft] = useState("");

  useEffect(() => {
    fetch("/api/admin/auth")
      .then((res) => setIsAuthenticated(res.ok))
      .catch(() => setIsAuthenticated(false))
      .finally(() => setIsAuthChecking(false));
  }, []);

  const loadReservations = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({ sortBy, order, payment: paymentFilter, status: statusFilter });
      const res = await fetch(`/api/admin/reservations?${query.toString()}`);
      if (res.status === 401) {
        setIsAuthenticated(false);
        setFeedback({ type: "error", message: "Sesión expirada. Inicia sesión nuevamente." });
        setReservations([]);
        return;
      }
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        setFeedback({ type: "error", message: payload?.error || "No se pudieron cargar los pedidos." });
        setReservations([]);
        return;
      }

      const data = (await res.json()) as { reservations?: ReservationItem[] };
      setReservations(Array.isArray(data.reservations) ? data.reservations : []);
      setFeedback(null);
    } catch {
      setFeedback({ type: "error", message: "Error de red al cargar pedidos." });
      setReservations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    void loadReservations();
  }, [isAuthenticated, sortBy, order, paymentFilter, statusFilter]);

  const updateReservationStatus = async (reservationId: number, status: ReservationStatus, paymentReviewNote?: string) => {
    setUpdatingReservationId(reservationId);
    try {
      const res = await fetch("/api/admin/reservations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reservationId,
          status,
          paymentReviewNote: paymentReviewNote ?? null,
        }),
      });

      const payload = await res.json().catch(() => null);
      if (!res.ok) {
        setFeedback({
          type: "error",
          message: payload?.error ? `No se pudo actualizar la reserva #${reservationId}: ${payload.error}` : `No se pudo actualizar la reserva #${reservationId}.`,
        });
        return;
      }

      setFeedback({ type: "success", message: `Reserva #${reservationId} actualizada a ${statusLabels[status]}.` });
      await loadReservations();
      setActiveReservation((prev) => {
        if (!prev || prev.id !== reservationId) return prev;
        return {
          ...prev,
          status,
          paid: status === "CONFIRMED",
          paymentReviewNote: paymentReviewNote ?? prev.paymentReviewNote,
        };
      });
    } catch {
      setFeedback({ type: "error", message: `Error de red actualizando la reserva #${reservationId}.` });
    } finally {
      setUpdatingReservationId(null);
    }
  };

  useEffect(() => {
    setReviewNoteDraft(activeReservation?.paymentReviewNote || "");
  }, [activeReservation?.id]);

  const title = useMemo(() => {
    if (sortBy === "createdAt") {
      return order === "desc"
        ? "Ordenadas por fecha de ingreso (más recientes primero)"
        : "Ordenadas por fecha de ingreso (más antiguas primero)";
    }

    return order === "desc"
      ? "Ordenadas por fecha reservada (más recientes primero)"
      : "Ordenadas por fecha reservada (más antiguas primero)";
  }, [order, sortBy]);

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
          <p className="mt-2 text-sm font-semibold text-rose-700">Debes iniciar sesión como administrador para ver los pedidos.</p>
          <Link href="/admin" className="mt-4 inline-flex rounded-lg bg-rose-700 px-4 py-2 text-sm font-bold text-white hover:bg-rose-600">
            Ir al login admin
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-6 rounded-3xl bg-gradient-to-r from-emerald-900 via-emerald-700 to-teal-600 p-6 text-white">
        <h1 className="text-3xl font-extrabold">Pedidos / Reservas</h1>
        <p className="mt-1 text-sm text-emerald-100">Revisa reservas por método y estado de pago manual o pasarela.</p>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <Link href="/admin" className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
          Volver al panel
        </Link>
        <Link href="/admin/pagos-manuales" className="rounded-lg border border-violet-300 bg-violet-50 px-3 py-2 text-sm font-semibold text-violet-700 hover:bg-violet-100">
          Pagos manuales
        </Link>
        <label className="text-sm font-semibold text-slate-700">Ordenar por</label>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortBy)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">
          <option value="createdAt">Fecha de ingreso</option>
          <option value="date">Fecha reservada</option>
        </select>
        <select value={order} onChange={(e) => setOrder(e.target.value as SortOrder)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">
          <option value="desc">Descendente</option>
          <option value="asc">Ascendente</option>
        </select>
        <label className="text-sm font-semibold text-slate-700">Método</label>
        <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value as PaymentFilter)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">
          <option value="all">Todos</option>
          <option value="gateway">Pasarela</option>
          <option value="manual">Manual</option>
        </select>
        <label className="text-sm font-semibold text-slate-700">Estado</label>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">
          <option value="all">Todos</option>
          <option value="pending">Pendientes</option>
          <option value="pending_payment">Pendiente de pago manual</option>
          <option value="payment_review">En revisión manual</option>
          <option value="confirmed">Confirmadas</option>
          <option value="rejected">Rechazadas</option>
          <option value="cancelled">Canceladas</option>
        </select>
        <button type="button" onClick={() => void loadReservations()} className="rounded-lg bg-emerald-700 px-3 py-2 text-sm font-bold text-white hover:bg-emerald-600">
          Actualizar
        </button>
      </div>

      <p className="mb-4 text-sm font-semibold text-slate-600">{title}</p>

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
                <th className="px-3 py-2 text-left font-bold text-slate-600">#</th>
                <th className="px-3 py-2 text-left font-bold text-slate-600">Fecha reservada</th>
                <th className="px-3 py-2 text-left font-bold text-slate-600">Tour</th>
                <th className="px-3 py-2 text-left font-bold text-slate-600">Contacto</th>
                <th className="px-3 py-2 text-left font-bold text-slate-600">Total</th>
                <th className="px-3 py-2 text-left font-bold text-slate-600">Pago</th>
                <th className="px-3 py-2 text-left font-bold text-slate-600">Estado</th>
                <th className="px-3 py-2 text-left font-bold text-slate-600">Detalle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-3 py-6 text-center font-semibold text-slate-500">Cargando pedidos...</td>
                </tr>
              ) : reservations.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-3 py-6 text-center font-semibold text-slate-500">No hay pedidos registrados.</td>
                </tr>
              ) : (
                reservations.map((item) => (
                  <tr key={item.id}>
                    <td className="px-3 py-3 font-extrabold text-slate-800">#{item.id}</td>
                    <td className="px-3 py-3 text-slate-700">
                      <p>{formatDateLong(item.date)}</p>
                      <p className="text-xs font-semibold text-slate-500">Hora reservada: {formatScheduleLabel(item.scheduleTime)}</p>
                    </td>
                    <td className="px-3 py-3 text-slate-800">{item.tour?.title || "-"}</td>
                    <td className="px-3 py-3 text-slate-700">
                      <p className="font-semibold text-slate-900">{[item.name, item.lastName].filter(Boolean).join(" ")}</p>
                      <p>{item.email}</p>
                      <p>{item.phone || "Sin teléfono"}</p>
                    </td>
                    <td className="px-3 py-3 text-slate-700">
                      <p className="font-extrabold text-emerald-800">{formatPriceDetail(item.totalAmount)}</p>
                      <p className="text-xs text-slate-500">Creada: {formatDateTime(item.createdAt)}</p>
                    </td>
                    <td className="px-3 py-3 text-slate-700">
                      <p className="font-semibold">{item.paymentMethod || "No indicado"}</p>
                      <p className="text-xs font-semibold text-slate-500">{item.paymentKind === "manual" ? "Manual" : "Pasarela"}</p>
                    </td>
                    <td className="px-3 py-3 text-slate-700">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-bold ${statusBadgeClass[normalizeReservationStatus(item.status)]}`}>
                        {statusLabels[normalizeReservationStatus(item.status)]}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-slate-700">
                      <button
                        type="button"
                        onClick={() => setActiveReservation(item)}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-1 text-xs font-bold text-slate-700 hover:border-emerald-300 hover:text-emerald-800"
                      >
                        Ver detalle
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {activeReservation ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900">Reserva #{activeReservation.id}</h2>
                <p className="text-sm font-semibold text-slate-600">Detalle completo de la reserva</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveReservation(null)}
                className="rounded-lg border border-slate-300 px-3 py-1 text-sm font-bold text-slate-700 hover:bg-slate-50"
              >
                Cerrar
              </button>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Estado</p>
                <p className="mt-1 text-sm font-black text-slate-900">{statusLabels[normalizeReservationStatus(activeReservation.status)]}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Método</p>
                <p className="mt-1 font-semibold text-slate-900">{activeReservation.paymentMethod || "No indicado"}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Fecha reservada</p>
                <p className="mt-1 font-semibold text-slate-900">{formatDateLong(activeReservation.date)}</p>
                <p className="text-sm text-slate-600">Hora reservada: {formatScheduleLabel(activeReservation.scheduleTime)}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Creada</p>
                <p className="mt-1 text-sm font-medium text-slate-600">{formatDateTime(activeReservation.createdAt)}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 sm:col-span-2">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Tour</p>
                <p className="mt-1 font-semibold text-slate-900">{activeReservation.tour?.title || "-"}</p>
                <p className="mt-1 text-sm text-slate-600">Paquete: {activeReservation.packageTitle || "No indicado"}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Cliente</p>
                <p className="mt-1 font-semibold text-slate-900">{[activeReservation.name, activeReservation.lastName].filter(Boolean).join(" ")}</p>
                <p className="text-sm text-slate-700">{activeReservation.email}</p>
                <p className="text-sm text-slate-700">{activeReservation.phone || "Sin teléfono"}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Total</p>
                <p className="mt-1 text-xl font-black text-emerald-800">{formatPriceDetail(activeReservation.totalAmount)}</p>
                <p className="text-sm text-slate-600">Personas: {activeReservation.people}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 sm:col-span-2">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Hospedaje</p>
                <p className="mt-1 font-semibold text-slate-900">{activeReservation.hotel || "Sin hospedaje"}</p>
              </div>
              {activeReservation.paymentKind === "manual" ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 sm:col-span-2">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Comprobante manual</p>
                  {activeReservation.manualPaymentProofUrl ? (
                    <div className="mt-2 flex flex-col gap-2">
                      <a href={activeReservation.manualPaymentProofUrl} target="_blank" rel="noreferrer" className="block w-40 overflow-hidden rounded-lg border border-violet-300 bg-white">
                        <img src={activeReservation.manualPaymentProofUrl} alt={`Comprobante reserva ${activeReservation.id}`} className="h-28 w-full object-cover" />
                      </a>
                      <a href={activeReservation.manualPaymentProofUrl} target="_blank" rel="noreferrer" className="inline-flex w-fit rounded-lg border border-violet-300 bg-violet-50 px-3 py-1 text-xs font-bold text-violet-800 hover:bg-violet-100">
                        Abrir imagen completa
                      </a>
                    </div>
                  ) : (
                    <p className="mt-1 text-sm text-slate-600">No hay comprobante adjunto. La reserva puede revisarse manualmente igual.</p>
                  )}
                </div>
              ) : null}

              {activeReservation.paymentKind === "manual" ? (
                <div className="rounded-xl border border-slate-200 bg-white p-3 sm:col-span-2">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Nota interna de revisión</p>
                  <textarea
                    rows={3}
                    value={reviewNoteDraft}
                    onChange={(event) => setReviewNoteDraft(event.target.value)}
                    className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    placeholder="Opcional: resultado de validación del comprobante"
                  />
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={updatingReservationId === activeReservation.id}
                      onClick={() => void updateReservationStatus(activeReservation.id, "PAYMENT_REVIEW", reviewNoteDraft)}
                      className="rounded-lg border border-violet-300 bg-violet-50 px-3 py-2 text-sm font-bold text-violet-800 hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Marcar en revisión
                    </button>
                    <button
                      type="button"
                      disabled={updatingReservationId === activeReservation.id}
                      onClick={() => void updateReservationStatus(activeReservation.id, "CONFIRMED", reviewNoteDraft)}
                      className="rounded-lg bg-emerald-700 px-3 py-2 text-sm font-bold text-white hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                      Aprobar pago manual
                    </button>
                    <button
                      type="button"
                      disabled={updatingReservationId === activeReservation.id}
                      onClick={() => void updateReservationStatus(activeReservation.id, "REJECTED", reviewNoteDraft)}
                      className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-800 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Rechazar pago
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
