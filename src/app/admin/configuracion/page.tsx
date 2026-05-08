"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

type AgencySettings = {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  logoUrl: string | null;
  coverImageUrl: string | null;
  publicHost: string | null;
  publicUrl: string | null;
};

type AgencySettingsForm = {
  id: number;
  slug: string;
  name: string;
  description: string;
  email: string;
  phone: string;
  whatsapp: string;
  logoUrl: string;
  coverImageUrl: string;
  publicHost: string;
  publicUrl: string;
};

function normalizeInputValue(value: string | null | undefined): string {
  return String(value ?? "");
}

export default function AdminAgencySettingsPage() {
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingField, setUploadingField] = useState<"logo" | "cover" | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [form, setForm] = useState<AgencySettingsForm>({
    id: 0,
    slug: "",
    name: "",
    description: "",
    email: "",
    phone: "",
    whatsapp: "",
    logoUrl: "",
    coverImageUrl: "",
    publicHost: "",
    publicUrl: "",
  });

  useEffect(() => {
    fetch("/api/admin/auth")
      .then((res) => setIsAuthenticated(res.ok))
      .catch(() => setIsAuthenticated(false))
      .finally(() => setIsAuthChecking(false));
  }, []);

  const loadAgency = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/agency");
      if (res.status === 401) {
        setIsAuthenticated(false);
        return;
      }

      const payload = await res.json().catch(() => null);
      if (!res.ok || !payload?.agency) {
        setFeedback({ type: "error", message: payload?.error || "No se pudo cargar la configuración de la agencia." });
        return;
      }

      const agency = payload.agency as AgencySettings;
      setForm({
        id: agency.id,
        slug: agency.slug,
        name: normalizeInputValue(agency.name),
        description: normalizeInputValue(agency.description),
        email: normalizeInputValue(agency.email),
        phone: normalizeInputValue(agency.phone),
        whatsapp: normalizeInputValue(agency.whatsapp),
        logoUrl: normalizeInputValue(agency.logoUrl),
        coverImageUrl: normalizeInputValue(agency.coverImageUrl),
        publicHost: normalizeInputValue(agency.publicHost),
        publicUrl: normalizeInputValue(agency.publicUrl),
      });
      setFeedback(null);
    } catch {
      setFeedback({ type: "error", message: "Error de red cargando la configuración de la agencia." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    void loadAgency();
  }, [isAuthenticated]);

  const updateField = (field: keyof AgencySettingsForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const uploadBrandingImage = async (field: "logo" | "cover", files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;

    setUploadingField(field);
    setFeedback(null);

    try {
      const body = new FormData();
      body.append("file", file);
      body.append("scope", "branding");

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body,
      });

      const payload = await res.json().catch(() => null);
      if (!res.ok || !Array.isArray(payload?.urls) || !payload.urls[0]) {
        setFeedback({ type: "error", message: payload?.error || "No se pudo subir la imagen." });
        return;
      }

      const nextUrl = String(payload.urls[0]);
      updateField(field === "logo" ? "logoUrl" : "coverImageUrl", nextUrl);
      setFeedback({ type: "success", message: field === "logo" ? "Logo actualizado en el formulario." : "Portada actualizada en el formulario." });
    } catch {
      setFeedback({ type: "error", message: "Error de red subiendo la imagen." });
    } finally {
      setUploadingField(null);
    }
  };

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/admin/agency", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          email: form.email,
          phone: form.phone,
          whatsapp: form.whatsapp,
          logoUrl: form.logoUrl,
          coverImageUrl: form.coverImageUrl,
        }),
      });

      const payload = await res.json().catch(() => null);
      if (!res.ok || !payload?.agency) {
        setFeedback({ type: "error", message: payload?.error || "No se pudo guardar la configuración." });
        return;
      }

      const agency = payload.agency as AgencySettings;
      setForm((prev) => ({
        ...prev,
        name: normalizeInputValue(agency.name),
        description: normalizeInputValue(agency.description),
        email: normalizeInputValue(agency.email),
        phone: normalizeInputValue(agency.phone),
        whatsapp: normalizeInputValue(agency.whatsapp),
        logoUrl: normalizeInputValue(agency.logoUrl),
        coverImageUrl: normalizeInputValue(agency.coverImageUrl),
        publicHost: normalizeInputValue(agency.publicHost),
        publicUrl: normalizeInputValue(agency.publicUrl),
      }));
      setFeedback({ type: "success", message: "Configuración de agencia guardada correctamente." });
    } catch {
      setFeedback({ type: "error", message: "Error de red guardando la configuración." });
    } finally {
      setLoading(false);
    }
  };

  if (isAuthChecking) {
    return (
      <section className="mx-auto max-w-5xl px-4 py-10">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold text-slate-600">Verificando sesión de administrador...</p>
        </div>
      </section>
    );
  }

  if (!isAuthenticated) {
    return (
      <section className="mx-auto max-w-5xl px-4 py-10">
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center shadow-sm">
          <h1 className="text-2xl font-extrabold text-rose-800">Sesión requerida</h1>
          <p className="mt-2 text-sm font-semibold text-rose-700">Debes iniciar sesión como administrador para editar la agencia.</p>
          <Link href="/admin" className="mt-4 inline-flex rounded-lg bg-rose-700 px-4 py-2 text-sm font-bold text-white hover:bg-rose-600">
            Ir al login admin
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-6 rounded-3xl bg-gradient-to-r from-emerald-900 via-emerald-700 to-teal-600 p-6 text-white shadow-xl shadow-emerald-950/20">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-100">Configuración comercial</p>
        <h1 className="mt-2 text-3xl font-black">Perfil público de la agencia</h1>
        <p className="mt-2 text-sm font-semibold text-emerald-50/90">Edita el branding y los datos de contacto que verá el storefront público.</p>
      </div>

      {feedback ? (
        <p className={`mb-5 rounded-xl p-3 text-sm font-semibold ${feedback.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
          {feedback.message}
        </p>
      ) : null}

      <form onSubmit={handleSave} className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="md:col-span-2">
              <span className="mb-1 block text-sm font-semibold text-slate-700">Nombre comercial</span>
              <input
                type="text"
                value={form.name}
                onChange={(event) => updateField("name", event.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2"
                required
              />
            </label>

            <label className="md:col-span-2">
              <span className="mb-1 block text-sm font-semibold text-slate-700">Descripción</span>
              <textarea
                value={form.description}
                onChange={(event) => updateField("description", event.target.value)}
                rows={5}
                className="w-full rounded-xl border border-slate-300 px-3 py-2"
              />
            </label>

            <label>
              <span className="mb-1 block text-sm font-semibold text-slate-700">Correo</span>
              <input
                type="email"
                value={form.email}
                onChange={(event) => updateField("email", event.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2"
              />
            </label>

            <label>
              <span className="mb-1 block text-sm font-semibold text-slate-700">Teléfono</span>
              <input
                type="text"
                value={form.phone}
                onChange={(event) => updateField("phone", event.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2"
              />
            </label>

            <label>
              <span className="mb-1 block text-sm font-semibold text-slate-700">WhatsApp</span>
              <input
                type="text"
                value={form.whatsapp}
                onChange={(event) => updateField("whatsapp", event.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2"
              />
            </label>

            <label>
              <span className="mb-1 block text-sm font-semibold text-slate-700">Slug interno</span>
              <input
                type="text"
                value={form.slug}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-500"
                readOnly
              />
            </label>

            <label className="md:col-span-2">
              <span className="mb-1 block text-sm font-semibold text-slate-700">URL de logo</span>
              <input
                type="text"
                value={form.logoUrl}
                onChange={(event) => updateField("logoUrl", event.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2"
              />
            </label>

            <label className="md:col-span-2">
              <span className="mb-1 block text-sm font-semibold text-slate-700">URL de portada</span>
              <input
                type="text"
                value={form.coverImageUrl}
                onChange={(event) => updateField("coverImageUrl", event.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2"
              />
            </label>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-black text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {loading ? "Guardando..." : "Guardar cambios"}
            </button>
            <Link href="/admin" className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50">
              Volver al panel
            </Link>
          </div>
        </div>

        <aside className="grid gap-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">Storefront automático</p>
            <p className="mt-2 text-sm font-semibold text-slate-600">El subdominio interno se genera desde el slug de la agencia y se registra en AgencyDomain.</p>
            <div className="mt-4 rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Host</p>
              <p className="mt-1 break-all text-sm font-black text-slate-900">{form.publicHost || "Pendiente de resolver"}</p>
              <p className="mt-3 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">URL pública</p>
              <p className="mt-1 break-all text-sm font-black text-emerald-700">{form.publicUrl || "Pendiente de resolver"}</p>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-black text-slate-900">Branding visual</h2>
            <div className="mt-4 grid gap-4">
              <div>
                <p className="mb-2 text-sm font-semibold text-slate-700">Logo</p>
                <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <img src={form.logoUrl || "/tour-placeholder.svg"} alt={form.name || "Logo de agencia"} className="h-20 w-20 rounded-2xl object-cover" />
                  <label className="inline-flex cursor-pointer rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">
                    {uploadingField === "logo" ? "Subiendo..." : "Subir logo"}
                    <input type="file" accept="image/*" className="hidden" onChange={(event) => void uploadBrandingImage("logo", event.target.files)} />
                  </label>
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-semibold text-slate-700">Portada</p>
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                  <img src={form.coverImageUrl || form.logoUrl || "/tour-placeholder.svg"} alt={form.name || "Portada de agencia"} className="h-40 w-full object-cover" />
                  <div className="p-4">
                    <label className="inline-flex cursor-pointer rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">
                      {uploadingField === "cover" ? "Subiendo..." : "Subir portada"}
                      <input type="file" accept="image/*" className="hidden" onChange={(event) => void uploadBrandingImage("cover", event.target.files)} />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </form>
    </section>
  );
}