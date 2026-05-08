"use client";

import React from "react";

type SubmitStatus = "idle" | "success" | "error";

export default function LandingLeadForm() {
  const [nombreCompleto, setNombreCompleto] = React.useState("");
  const [agencia, setAgencia] = React.useState("");
  const [whatsapp, setWhatsapp] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [pais, setPais] = React.useState("");
  const [tieneWeb, setTieneWeb] = React.useState("");
  const [urlActual, setUrlActual] = React.useState("");
  const [cantidadTours, setCantidadTours] = React.useState("");
  const [necesidadPrincipal, setNecesidadPrincipal] = React.useState("");
  const [mensaje, setMensaje] = React.useState("");

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [status, setStatus] = React.useState("");
  const [statusType, setStatusType] = React.useState<SubmitStatus>("idle");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!nombreCompleto || !agencia || !whatsapp || !email || !pais || !tieneWeb || !cantidadTours || !necesidadPrincipal) {
      setStatusType("error");
      setStatus("Por favor completa todos los campos obligatorios antes de enviar.");
      return;
    }

    setIsSubmitting(true);
    setStatusType("idle");
    setStatus("Enviando solicitud...");

    const payloadMessage = [
      `Nombre completo: ${nombreCompleto.trim()}`,
      `Agencia: ${agencia.trim()}`,
      `País: ${pais.trim()}`,
      `Tiene página web: ${tieneWeb}`,
      `URL actual: ${urlActual.trim() || "No aplica"}`,
      `Cantidad de tours: ${cantidadTours}`,
      `Necesidad principal: ${necesidadPrincipal}`,
      "",
      "Mensaje adicional:",
      mensaje.trim() || "Sin mensaje adicional.",
    ].join("\n");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: nombreCompleto.trim(),
          telefono: whatsapp.trim(),
          email: email.trim(),
          asunto: "Solicitud de web para agencia de tours",
          mensaje: payloadMessage,
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setStatusType("error");
        setStatus(data?.error || "No se pudo enviar la solicitud. Intenta de nuevo.");
        return;
      }

      setStatusType("success");
      setStatus("Envío exitoso. Recibimos tu solicitud y te contactaremos pronto.");

      setNombreCompleto("");
      setAgencia("");
      setWhatsapp("");
      setEmail("");
      setPais("");
      setTieneWeb("");
      setUrlActual("");
      setCantidadTours("");
      setNecesidadPrincipal("");
      setMensaje("");
    } catch {
      setStatusType("error");
      setStatus("No se pudo enviar la solicitud por un error de conexión.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusClassName =
    statusType === "success"
      ? "mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-center text-sm font-semibold text-emerald-800"
      : statusType === "error"
        ? "mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-center text-sm font-semibold text-rose-700"
        : "mt-4 rounded-xl border border-emerald-200/30 bg-emerald-900/20 p-3 text-center text-sm font-semibold text-emerald-100";

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto mt-10 grid max-w-4xl gap-4 rounded-2xl border border-white/20 bg-white/10 p-5 backdrop-blur-sm sm:mt-12 sm:p-6 md:grid-cols-2"
    >
      <label className="grid gap-2 text-sm font-semibold">
        Nombre completo
        <input
          required
          name="nombreCompleto"
          value={nombreCompleto}
          onChange={(e) => setNombreCompleto(e.target.value)}
          className="rounded-xl border border-white/25 bg-white/95 px-4 py-3 text-slate-900 outline-none ring-emerald-300 focus:ring"
        />
      </label>

      <label className="grid gap-2 text-sm font-semibold">
        Nombre de la agencia
        <input
          required
          name="agencia"
          value={agencia}
          onChange={(e) => setAgencia(e.target.value)}
          className="rounded-xl border border-white/25 bg-white/95 px-4 py-3 text-slate-900 outline-none ring-emerald-300 focus:ring"
        />
      </label>

      <label className="grid gap-2 text-sm font-semibold">
        WhatsApp
        <input
          required
          name="whatsapp"
          type="tel"
          minLength={7}
          pattern="[0-9+()\-\s]{7,}"
          value={whatsapp}
          onChange={(e) => setWhatsapp(e.target.value)}
          className="rounded-xl border border-white/25 bg-white/95 px-4 py-3 text-slate-900 outline-none ring-emerald-300 focus:ring"
        />
      </label>

      <label className="grid gap-2 text-sm font-semibold">
        Correo electrónico
        <input
          required
          name="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-xl border border-white/25 bg-white/95 px-4 py-3 text-slate-900 outline-none ring-emerald-300 focus:ring"
        />
      </label>

      <label className="grid self-start gap-2 text-sm font-semibold">
        País
        <input
          required
          name="pais"
          value={pais}
          onChange={(e) => setPais(e.target.value)}
          className="h-12 rounded-xl border border-white/25 bg-white/95 px-4 text-slate-900 outline-none ring-emerald-300 focus:ring"
        />
      </label>

      <fieldset className="grid gap-2 text-sm font-semibold">
        <legend className="mb-1 text-sm">¿Tienes página web actualmente?</legend>
        <label className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 py-2">
          <input required type="radio" name="tieneWeb" value="si" checked={tieneWeb === "si"} onChange={(e) => setTieneWeb(e.target.value)} />
          Si
        </label>
        <label className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 py-2">
          <input required type="radio" name="tieneWeb" value="no" checked={tieneWeb === "no"} onChange={(e) => setTieneWeb(e.target.value)} />
          No
        </label>
      </fieldset>

      <label className="grid gap-2 text-sm font-semibold md:col-span-2">
        URL de la página actual (opcional)
        <input
          name="urlActual"
          type="url"
          placeholder="https://tuagencia.com"
          value={urlActual}
          onChange={(e) => setUrlActual(e.target.value)}
          className="rounded-xl border border-white/25 bg-white/95 px-4 py-3 text-slate-900 outline-none ring-emerald-300 focus:ring"
        />
      </label>

      <label className="grid gap-2 text-sm font-semibold">
        Cuantos tours manejas aproximadamente?
        <select
          required
          name="cantidadTours"
          value={cantidadTours}
          onChange={(e) => setCantidadTours(e.target.value)}
          className="rounded-xl border border-white/25 bg-white/95 px-4 py-3 text-slate-900 outline-none ring-emerald-300 focus:ring"
        >
          <option value="">Selecciona una opción</option>
          <option value="1-5">1-5</option>
          <option value="6-15">6-15</option>
          <option value="16-30">16-30</option>
          <option value="mas-de-30">más de 30</option>
        </select>
      </label>

      <label className="grid gap-2 text-sm font-semibold">
        ¿Qué necesitas principalmente?
        <select
          required
          name="necesidadPrincipal"
          value={necesidadPrincipal}
          onChange={(e) => setNecesidadPrincipal(e.target.value)}
          className="rounded-xl border border-white/25 bg-white/95 px-4 py-3 text-slate-900 outline-none ring-emerald-300 focus:ring"
        >
          <option value="">Selecciona una opción</option>
          <option value="mostrar-tours">Mostrar tours de forma profesional</option>
          <option value="consultas-reservas">Recibir consultas o reservas</option>
          <option value="pagos-online">Aceptar pagos online</option>
          <option value="mejorar-web">Mejorar una web existente</option>
          <option value="crear-web">Crear una web desde cero</option>
        </select>
      </label>

      <label className="grid gap-2 text-sm font-semibold md:col-span-2">
        Mensaje adicional
        <textarea
          name="mensaje"
          rows={5}
          placeholder="Cuéntanos qué tours vendes y qué objetivo quieres lograr con tu web"
          value={mensaje}
          onChange={(e) => setMensaje(e.target.value)}
          className="rounded-xl border border-white/25 bg-white/95 px-4 py-3 text-slate-900 outline-none ring-emerald-300 focus:ring"
        />
      </label>

      <div className="md:col-span-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-xl bg-emerald-400 px-6 py-3 text-base font-extrabold text-emerald-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-80 sm:py-4 sm:text-lg"
        >
          {isSubmitting ? "Enviando..." : "Enviar solicitud"}
        </button>
        <p className="mt-3 text-center text-sm text-emerald-100/80">
          Formulario demo con validación básica. Te ayuda a visualizar la experiencia de captación.
        </p>

        {status ? <p className={statusClassName}>{status}</p> : null}
      </div>
    </form>
  );
}
