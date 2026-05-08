"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type PaymentMode = "GATEWAY" | "MANUAL" | "BOTH";

type PaymentSettingsForm = {
  paymentMode: PaymentMode;
  gatewayProvider: string;
  onvoSecretKey: string;
  onvoPublicKey: string;
  onvoWebhookSecret: string;
  manualPaymentInstructions: string;
  bankAccountName: string;
  bankAccountNumber: string;
  bankAccountIban: string;
  sinpeMobile: string;
  updatedAt: string;
};

function getModeFromToggles(enableGateway: boolean, enableManual: boolean): PaymentMode {
  if (enableGateway && enableManual) return "BOTH";
  if (enableGateway) return "GATEWAY";
  return "MANUAL";
}

function getTogglesFromMode(mode: PaymentMode): { enableGateway: boolean; enableManual: boolean } {
  if (mode === "BOTH") return { enableGateway: true, enableManual: true };
  if (mode === "GATEWAY") return { enableGateway: true, enableManual: false };
  return { enableGateway: false, enableManual: true };
}

function normalizeInput(value: string | null | undefined): string {
  return String(value ?? "");
}

export default function AdminPaymentSettingsPage() {
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [form, setForm] = useState<PaymentSettingsForm>({
    paymentMode: "BOTH",
    gatewayProvider: "ONVO",
    onvoSecretKey: "",
    onvoPublicKey: "",
    onvoWebhookSecret: "",
    manualPaymentInstructions: "",
    bankAccountName: "",
    bankAccountNumber: "",
    bankAccountIban: "",
    sinpeMobile: "",
    updatedAt: "",
  });

  const toggles = useMemo(() => getTogglesFromMode(form.paymentMode), [form.paymentMode]);

  useEffect(() => {
    fetch("/api/admin/auth")
      .then((res) => setIsAuthenticated(res.ok))
      .catch(() => setIsAuthenticated(false))
      .finally(() => setIsAuthChecking(false));
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/payment-settings");
      if (res.status === 401) {
        setIsAuthenticated(false);
        return;
      }

      const payload = await res.json().catch(() => null);
      if (!res.ok || !payload?.settings) {
        setFeedback({ type: "error", message: payload?.error || "No se pudo cargar la configuración de pagos." });
        return;
      }

      const settings = payload.settings as PaymentSettingsForm;
      setForm({
        paymentMode: settings.paymentMode,
        gatewayProvider: normalizeInput(settings.gatewayProvider) || "ONVO",
        onvoSecretKey: normalizeInput(settings.onvoSecretKey),
        onvoPublicKey: normalizeInput(settings.onvoPublicKey),
        onvoWebhookSecret: normalizeInput(settings.onvoWebhookSecret),
        manualPaymentInstructions: normalizeInput(settings.manualPaymentInstructions),
        bankAccountName: normalizeInput(settings.bankAccountName),
        bankAccountNumber: normalizeInput(settings.bankAccountNumber),
        bankAccountIban: normalizeInput(settings.bankAccountIban),
        sinpeMobile: normalizeInput(settings.sinpeMobile),
        updatedAt: normalizeInput(settings.updatedAt),
      });
      setFeedback(null);
    } catch {
      setFeedback({ type: "error", message: "Error de red cargando la configuración de pagos." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    void loadSettings();
  }, [isAuthenticated]);

  const updateField = (field: keyof PaymentSettingsForm, value: string | PaymentMode) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const togglePaymentMethod = (target: "gateway" | "manual", nextChecked: boolean) => {
    const nextGateway = target === "gateway" ? nextChecked : toggles.enableGateway;
    const nextManual = target === "manual" ? nextChecked : toggles.enableManual;

    if (!nextGateway && !nextManual) {
      setFeedback({ type: "error", message: "Debes dejar activo al menos un método de pago." });
      return;
    }

    setFeedback(null);
    updateField("paymentMode", getModeFromToggles(nextGateway, nextManual));
  };

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/admin/payment-settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paymentMode: form.paymentMode,
          gatewayProvider: form.gatewayProvider || "ONVO",
          onvoSecretKey: form.onvoSecretKey,
          onvoPublicKey: form.onvoPublicKey,
          onvoWebhookSecret: form.onvoWebhookSecret,
          manualPaymentInstructions: form.manualPaymentInstructions,
          bankAccountName: form.bankAccountName,
          bankAccountNumber: form.bankAccountNumber,
          bankAccountIban: form.bankAccountIban,
          sinpeMobile: form.sinpeMobile,
        }),
      });

      const payload = await res.json().catch(() => null);
      if (!res.ok || !payload?.settings) {
        setFeedback({ type: "error", message: payload?.error || "No se pudo guardar la configuración de pagos." });
        return;
      }

      const settings = payload.settings as PaymentSettingsForm;
      setForm((prev) => ({
        ...prev,
        paymentMode: settings.paymentMode,
        gatewayProvider: normalizeInput(settings.gatewayProvider) || "ONVO",
        onvoSecretKey: normalizeInput(settings.onvoSecretKey),
        onvoPublicKey: normalizeInput(settings.onvoPublicKey),
        onvoWebhookSecret: normalizeInput(settings.onvoWebhookSecret),
        manualPaymentInstructions: normalizeInput(settings.manualPaymentInstructions),
        bankAccountName: normalizeInput(settings.bankAccountName),
        bankAccountNumber: normalizeInput(settings.bankAccountNumber),
        bankAccountIban: normalizeInput(settings.bankAccountIban),
        sinpeMobile: normalizeInput(settings.sinpeMobile),
        updatedAt: normalizeInput(settings.updatedAt),
      }));
      setFeedback({ type: "success", message: "Configuración de pagos actualizada correctamente." });
    } catch {
      setFeedback({ type: "error", message: "Error de red guardando la configuración de pagos." });
    } finally {
      setLoading(false);
    }
  };

  if (isAuthChecking) {
    return (
      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold text-slate-600">Verificando sesión de administrador...</p>
        </div>
      </section>
    );
  }

  if (!isAuthenticated) {
    return (
      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center shadow-sm">
          <h1 className="text-2xl font-extrabold text-rose-800">Sesión requerida</h1>
          <p className="mt-2 text-sm font-semibold text-rose-700">Debes iniciar sesión como administrador para editar pagos.</p>
          <Link href="/admin" className="mt-4 inline-flex rounded-lg bg-rose-700 px-4 py-2 text-sm font-bold text-white hover:bg-rose-600">
            Ir al login admin
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-6 rounded-3xl bg-gradient-to-r from-emerald-900 via-emerald-700 to-teal-600 p-6 text-white shadow-xl shadow-emerald-950/20">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-100">Configuración de cobros</p>
        <h1 className="mt-2 text-3xl font-black">Métodos de pago por agencia</h1>
        <p className="mt-2 text-sm font-semibold text-emerald-50/90">Define si esta agencia cobra por pasarela, pago manual o ambos.</p>
      </div>

      {feedback ? (
        <p className={`mb-5 rounded-xl p-3 text-sm font-semibold ${feedback.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
          {feedback.message}
        </p>
      ) : null}

      <form onSubmit={handleSave} className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-black text-slate-900">Métodos activos</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={toggles.enableGateway}
                onChange={(event) => togglePaymentMethod("gateway", event.target.checked)}
              />
              Activar pasarela
            </label>
            <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={toggles.enableManual}
                onChange={(event) => togglePaymentMethod("manual", event.target.checked)}
              />
              Activar pago manual
            </label>
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Pasarela</p>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <label className="md:col-span-2">
                <span className="mb-1 block text-sm font-semibold text-slate-700">Proveedor</span>
                <input
                  type="text"
                  value={form.gatewayProvider}
                  onChange={(event) => updateField("gatewayProvider", event.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
                  placeholder="ONVO"
                />
              </label>
              <label className="md:col-span-2">
                <span className="mb-1 block text-sm font-semibold text-slate-700">ONVO Secret Key</span>
                <input
                  type="password"
                  value={form.onvoSecretKey}
                  onChange={(event) => updateField("onvoSecretKey", event.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
                  placeholder="onvo_test_secret_key..."
                />
              </label>
              <label>
                <span className="mb-1 block text-sm font-semibold text-slate-700">ONVO Public Key</span>
                <input
                  type="text"
                  value={form.onvoPublicKey}
                  onChange={(event) => updateField("onvoPublicKey", event.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
                  placeholder="onvo_test_publishable_key..."
                />
              </label>
              <label>
                <span className="mb-1 block text-sm font-semibold text-slate-700">ONVO Webhook Secret</span>
                <input
                  type="text"
                  value={form.onvoWebhookSecret}
                  onChange={(event) => updateField("onvoWebhookSecret", event.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
                  placeholder="webhook_secret_..."
                />
              </label>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Pago manual</p>
            <div className="mt-3 grid gap-3">
              <label>
                <span className="mb-1 block text-sm font-semibold text-slate-700">Instrucciones de transferencia</span>
                <textarea
                  rows={4}
                  value={form.manualPaymentInstructions}
                  onChange={(event) => updateField("manualPaymentInstructions", event.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
                  placeholder="Comparte aquí el proceso para transferencias y depósitos."
                />
              </label>
              <div className="grid gap-3 md:grid-cols-2">
                <label>
                  <span className="mb-1 block text-sm font-semibold text-slate-700">Nombre de cuenta</span>
                  <input
                    type="text"
                    value={form.bankAccountName}
                    onChange={(event) => updateField("bankAccountName", event.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
                  />
                </label>
                <label>
                  <span className="mb-1 block text-sm font-semibold text-slate-700">Número de cuenta</span>
                  <input
                    type="text"
                    value={form.bankAccountNumber}
                    onChange={(event) => updateField("bankAccountNumber", event.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
                  />
                </label>
                <label>
                  <span className="mb-1 block text-sm font-semibold text-slate-700">IBAN</span>
                  <input
                    type="text"
                    value={form.bankAccountIban}
                    onChange={(event) => updateField("bankAccountIban", event.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
                  />
                </label>
                <label>
                  <span className="mb-1 block text-sm font-semibold text-slate-700">SINPE móvil</span>
                  <input
                    type="text"
                    value={form.sinpeMobile}
                    onChange={(event) => updateField("sinpeMobile", event.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-black text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {loading ? "Guardando..." : "Guardar configuración"}
            </button>
            <Link href="/admin" className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50">
              Volver al panel
            </Link>
          </div>
        </div>

        <aside className="grid gap-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-black text-slate-900">Resumen actual</h2>
            <div className="mt-3 space-y-2 text-sm text-slate-700">
              <p><span className="font-bold">Modo:</span> {form.paymentMode}</p>
              <p><span className="font-bold">Pasarela:</span> {toggles.enableGateway ? "Activa" : "Inactiva"}</p>
              <p><span className="font-bold">Manual:</span> {toggles.enableManual ? "Activo" : "Inactivo"}</p>
              <p><span className="font-bold">Proveedor:</span> {form.gatewayProvider || "ONVO"}</p>
              <p><span className="font-bold">Actualizado:</span> {form.updatedAt ? new Date(form.updatedAt).toLocaleString("es-CR") : "-"}</p>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-black text-slate-900">Revisión manual de pagos</h2>
            <p className="mt-2 text-sm text-slate-600">Después de guardar esta configuración, gestiona comprobantes y aprobaciones desde la vista de pagos manuales.</p>
            <Link
              href="/admin/pagos-manuales"
              className="mt-4 inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm font-black text-white transition hover:bg-slate-800"
            >
              Ir a pagos manuales
            </Link>
          </div>
        </aside>
      </form>
    </section>
  );
}
