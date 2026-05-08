import Link from "next/link";

type SearchParams = {
  reserva?: string;
  estado?: string;
  metodo?: string;
  mensaje?: string;
};

function firstValue(value: string | string[] | undefined): string {
  return Array.isArray(value) ? String(value[0] ?? "") : String(value ?? "");
}

function normalizeComparableText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export default async function ReservaConfirmadaPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const reservationId = firstValue(params.reserva).trim();
  const statusRaw = firstValue(params.estado).trim().toLowerCase();
  const paymentMethod = firstValue(params.metodo).trim();
  const message = firstValue(params.mensaje).trim();

  const status = statusRaw === "pending_validation" ? "pending_payment" : statusRaw;

  const statusView = (() => {
    if (status === "pending") {
      return {
        title: "Pago En Proceso",
        subtitle: "Estamos procesando tu pago en pasarela.",
        summary: "Te confirmaremos por correo apenas el pago quede aprobado.",
        badge: "Pago en proceso",
        cardClass: "border-amber-200 bg-amber-50",
        badgeClass: "bg-amber-200 text-amber-900",
      };
    }

    if (status === "pending_payment") {
      return {
        title: "Reserva Pendiente De Pago",
        subtitle: "Tu reserva quedó registrada con pago manual pendiente.",
        summary: "Cuando realices el pago manual, el equipo lo revisará y te enviaremos la confirmación.",
        badge: "Pendiente de pago manual",
        cardClass: "border-orange-200 bg-orange-50",
        badgeClass: "bg-orange-200 text-orange-900",
      };
    }

    if (status === "payment_review") {
      return {
        title: "Pago En Revisión",
        subtitle: "Recibimos tu pago manual y está en revisión.",
        summary: "Te notificaremos por correo cuando finalice la validación.",
        badge: "Pago en revisión",
        cardClass: "border-violet-200 bg-violet-50",
        badgeClass: "bg-violet-200 text-violet-900",
      };
    }

    if (status === "rejected") {
      return {
        title: "Pago Rechazado",
        subtitle: "No pudimos validar tu pago manual.",
        summary: "Puedes contactar a soporte para reenviar el comprobante o gestionar una nueva reserva.",
        badge: "Pago rechazado",
        cardClass: "border-rose-200 bg-rose-50",
        badgeClass: "bg-rose-200 text-rose-900",
      };
    }

    return {
      title: "Reserva Confirmada",
      subtitle: "Tu pago fue validado y tu reserva quedó confirmada.",
      summary: "Te enviamos la confirmación al correo registrado.",
      badge: "Confirmada",
      cardClass: "border-emerald-200 bg-emerald-50",
      badgeClass: "bg-emerald-200 text-emerald-900",
    };
  })();

  const title = statusView.title;
  const subtitle = statusView.subtitle;
  const summary = message || statusView.summary;
  const normalizedSubtitle = normalizeComparableText(subtitle);
  const normalizedSummary = normalizeComparableText(summary);
  const shouldShowSummary = normalizedSummary.length > 0 && normalizedSummary !== normalizedSubtitle;

  return (
    <section className="mx-auto max-w-3xl px-4 py-10">
      <article
        className={`rounded-2xl border p-6 shadow-sm ${statusView.cardClass}`}
      >
        <p
          className={`inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${statusView.badgeClass}`}
        >
          {statusView.badge}
        </p>

        <h1 className="mt-4 text-3xl font-black text-slate-900">{title}</h1>
        <p className="mt-2 text-sm font-semibold text-slate-700">{subtitle}</p>
        {shouldShowSummary ? <p className="mt-3 text-sm text-slate-700">{summary}</p> : null}

        <div className="mt-5 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700 sm:grid-cols-2">
          <p>
            <span className="font-bold text-slate-900">Reserva:</span>{" "}
            {reservationId ? `#${reservationId}` : "Por asignar"}
          </p>
          <p>
            <span className="font-bold text-slate-900">Método de pago:</span>{" "}
            {paymentMethod || "No indicado"}
          </p>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <Link
            href="/tours"
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white transition hover:bg-slate-800"
          >
            Ver más tours
          </Link>
          <Link
            href="/"
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-slate-400"
          >
            Ir al inicio
          </Link>
        </div>
      </article>
    </section>
  );
}
