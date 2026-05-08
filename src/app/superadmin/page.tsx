"use client";

import React, { useEffect, useMemo, useState } from "react";

type AgencyStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";
type SuspendedStorefrontMode = "BLOCK" | "HIDE";

type AgencyItem = {
  id: number;
  name: string;
  slug: string;
  internalSubdomain: string | null;
  email: string | null;
  status: AgencyStatus;
  suspendedStorefrontMode: SuspendedStorefrontMode;
  createdAt: string;
  updatedAt: string;
  counts: {
    tours: number;
    reservations: number;
  };
  users: Array<{
    id: number;
    email: string;
    name: string | null;
    role: string;
    createdAt: string;
  }>;
  domains: Array<{
    id: number;
    host: string;
    isPrimary: boolean;
    isVerified: boolean;
    type: string;
  }>;
};

type AgenciesResponse = {
  agencies: AgencyItem[];
};

type CreateAgencyForm = {
  name: string;
  slug: string;
  email: string;
  ownerEmail: string;
  ownerName: string;
  internalSubdomain: string;
  status: AgencyStatus;
};

function normalizeSlug(input: string): string {
  return String(input ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function formatDate(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleString("es-CR");
}

export default function SuperAdminPage() {
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [authMessage, setAuthMessage] = useState("");

  const [agencies, setAgencies] = useState<AgencyItem[]>([]);
  const [loadingAgencies, setLoadingAgencies] = useState(false);
  const [savingAgencyId, setSavingAgencyId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [createForm, setCreateForm] = useState<CreateAgencyForm>({
    name: "",
    slug: "",
    email: "",
    ownerEmail: "",
    ownerName: "",
    internalSubdomain: "",
    status: "ACTIVE",
  });
  const [creatingAgency, setCreatingAgency] = useState(false);

  const [rowEdits, setRowEdits] = useState<Record<number, { status: AgencyStatus; suspendedStorefrontMode: SuspendedStorefrontMode; internalSubdomain: string }>>({});

  const loadAgencies = async () => {
    setLoadingAgencies(true);
    try {
      const res = await fetch("/api/superadmin/agencies");
      if (res.status === 401) {
        setIsAuthenticated(false);
        setAgencies([]);
        return;
      }

      const payload = (await res.json().catch(() => null)) as AgenciesResponse | null;
      if (!res.ok || !payload?.agencies) {
        setFeedback({ type: "error", message: "No se pudieron cargar las agencias." });
        setAgencies([]);
        return;
      }

      const nextAgencies = Array.isArray(payload.agencies) ? payload.agencies : [];
      setAgencies(nextAgencies);
      setRowEdits((prev) => {
        const next = { ...prev };
        nextAgencies.forEach((agency) => {
          if (!next[agency.id]) {
            next[agency.id] = {
              status: agency.status,
              suspendedStorefrontMode: agency.suspendedStorefrontMode,
              internalSubdomain: agency.internalSubdomain || agency.slug,
            };
          }
        });
        return next;
      });
    } catch {
      setFeedback({ type: "error", message: "Error de red cargando agencias." });
      setAgencies([]);
    } finally {
      setLoadingAgencies(false);
    }
  };

  useEffect(() => {
    fetch("/api/superadmin/auth")
      .then((res) => setIsAuthenticated(res.ok))
      .catch(() => setIsAuthenticated(false))
      .finally(() => setIsAuthChecking(false));
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    void loadAgencies();
  }, [isAuthenticated]);

  const totalAgencies = agencies.length;
  const activeAgencies = useMemo(() => agencies.filter((item) => item.status === "ACTIVE").length, [agencies]);
  const suspendedAgencies = useMemo(() => agencies.filter((item) => item.status === "SUSPENDED").length, [agencies]);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthMessage("");

    try {
      const res = await fetch("/api/superadmin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: loginUsername, password: loginPassword }),
      });

      const payload = await res.json().catch(() => null);
      if (!res.ok) {
        setAuthMessage(payload?.error || "No se pudo iniciar sesión de superadmin.");
        return;
      }

      setIsAuthenticated(true);
      setLoginPassword("");
      setAuthMessage("");
    } catch {
      setAuthMessage("Error de red intentando iniciar sesión.");
    }
  };

  const handleLogout = async () => {
    await fetch("/api/superadmin/auth", { method: "DELETE" }).catch(() => null);
    setIsAuthenticated(false);
    setAgencies([]);
    setFeedback(null);
  };

  const handleCreateAgency = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCreatingAgency(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/superadmin/agencies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: createForm.name,
          slug: normalizeSlug(createForm.slug),
          email: createForm.email,
          ownerEmail: createForm.ownerEmail,
          ownerName: createForm.ownerName,
          internalSubdomain: normalizeSlug(createForm.internalSubdomain),
          status: createForm.status,
        }),
      });

      const payload = await res.json().catch(() => null);
      if (!res.ok) {
        setFeedback({ type: "error", message: payload?.error || "No se pudo crear la agencia." });
        return;
      }

      setFeedback({ type: "success", message: "Agencia creada correctamente." });
      setCreateForm({
        name: "",
        slug: "",
        email: "",
        ownerEmail: "",
        ownerName: "",
        internalSubdomain: "",
        status: "ACTIVE",
      });
      await loadAgencies();
    } catch {
      setFeedback({ type: "error", message: "Error de red creando la agencia." });
    } finally {
      setCreatingAgency(false);
    }
  };

  const saveAgencyStatus = async (agencyId: number) => {
    const currentEdit = rowEdits[agencyId];
    if (!currentEdit) return;

    setSavingAgencyId(agencyId);
    setFeedback(null);

    try {
      const res = await fetch("/api/superadmin/agencies", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agencyId,
          status: currentEdit.status,
          suspendedStorefrontMode: currentEdit.suspendedStorefrontMode,
          internalSubdomain: normalizeSlug(currentEdit.internalSubdomain),
        }),
      });

      const payload = await res.json().catch(() => null);
      if (!res.ok) {
        setFeedback({ type: "error", message: payload?.error || `No se pudo actualizar la agencia #${agencyId}.` });
        return;
      }

      setFeedback({ type: "success", message: `Agencia #${agencyId} actualizada correctamente.` });
      await loadAgencies();
    } catch {
      setFeedback({ type: "error", message: `Error de red actualizando la agencia #${agencyId}.` });
    } finally {
      setSavingAgencyId(null);
    }
  };

  if (isAuthChecking) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-10">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold text-slate-600">Verificando sesión de superadmin...</p>
        </div>
      </section>
    );
  }

  if (!isAuthenticated) {
    return (
      <section className="mx-auto max-w-md px-4 py-16">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-lg">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Control central</p>
          <h1 className="mt-2 text-3xl font-black text-slate-900">Superadmin</h1>
          <p className="mt-2 text-sm text-slate-600">Inicia sesión para administrar todas las agencias de la plataforma.</p>

          <form onSubmit={handleLogin} className="mt-6 grid gap-3">
            <label>
              <span className="mb-1 block text-sm font-semibold text-slate-700">Usuario</span>
              <input
                type="text"
                value={loginUsername}
                onChange={(event) => setLoginUsername(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
                required
              />
            </label>
            <label>
              <span className="mb-1 block text-sm font-semibold text-slate-700">Contraseña</span>
              <input
                type="password"
                value={loginPassword}
                onChange={(event) => setLoginPassword(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
                required
              />
            </label>
            <button type="submit" className="mt-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-black text-white hover:bg-slate-800">
              Entrar al panel superadmin
            </button>
          </form>

          {authMessage ? <p className="mt-4 rounded-lg bg-rose-50 p-3 text-sm font-semibold text-rose-700">{authMessage}</p> : null}
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-6 rounded-3xl bg-gradient-to-r from-slate-950 via-slate-800 to-blue-900 p-6 text-white shadow-xl shadow-slate-900/30">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-200">Administrador global</p>
        <h1 className="mt-2 text-3xl font-black">Panel Superadmin</h1>
        <p className="mt-2 text-sm font-semibold text-blue-100">Gestiona agencias, estados y onboarding sin tocar la base de datos manualmente.</p>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <button type="button" onClick={() => void loadAgencies()} className="rounded-lg bg-blue-700 px-3 py-2 text-sm font-bold text-white hover:bg-blue-600">
          Actualizar
        </button>
        <button type="button" onClick={handleLogout} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
          Cerrar sesión
        </button>
      </div>

      {feedback ? (
        <p className={`mb-4 rounded-xl p-3 text-sm font-semibold ${feedback.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
          {feedback.message}
        </p>
      ) : null}

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Agencias totales</p>
          <p className="mt-2 text-3xl font-black text-slate-900">{totalAgencies}</p>
        </article>
        <article className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">Agencias activas</p>
          <p className="mt-2 text-3xl font-black text-emerald-900">{activeAgencies}</p>
        </article>
        <article className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-700">Agencias suspendidas</p>
          <p className="mt-2 text-3xl font-black text-amber-900">{suspendedAgencies}</p>
        </article>
      </div>

      <div className="mb-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-black text-slate-900">Alta manual de agencia</h2>
        <p className="mt-1 text-sm text-slate-600">Crea un cliente nuevo con owner inicial y subdominio interno.</p>

        <form onSubmit={handleCreateAgency} className="mt-4 grid gap-3 md:grid-cols-2">
          <label>
            <span className="mb-1 block text-sm font-semibold text-slate-700">Nombre</span>
            <input type="text" value={createForm.name} onChange={(event) => setCreateForm((prev) => ({ ...prev, name: event.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2" required />
          </label>
          <label>
            <span className="mb-1 block text-sm font-semibold text-slate-700">Slug</span>
            <input type="text" value={createForm.slug} onChange={(event) => setCreateForm((prev) => ({ ...prev, slug: event.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2" required />
          </label>
          <label>
            <span className="mb-1 block text-sm font-semibold text-slate-700">Correo principal agencia</span>
            <input type="email" value={createForm.email} onChange={(event) => setCreateForm((prev) => ({ ...prev, email: event.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
          </label>
          <label>
            <span className="mb-1 block text-sm font-semibold text-slate-700">Usuario owner inicial (correo)</span>
            <input type="email" value={createForm.ownerEmail} onChange={(event) => setCreateForm((prev) => ({ ...prev, ownerEmail: event.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2" required />
          </label>
          <label>
            <span className="mb-1 block text-sm font-semibold text-slate-700">Nombre owner inicial</span>
            <input type="text" value={createForm.ownerName} onChange={(event) => setCreateForm((prev) => ({ ...prev, ownerName: event.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
          </label>
          <label>
            <span className="mb-1 block text-sm font-semibold text-slate-700">Subdominio interno</span>
            <input type="text" value={createForm.internalSubdomain} onChange={(event) => setCreateForm((prev) => ({ ...prev, internalSubdomain: event.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2" required />
          </label>
          <label className="md:col-span-2">
            <span className="mb-1 block text-sm font-semibold text-slate-700">Estado inicial</span>
            <select value={createForm.status} onChange={(event) => setCreateForm((prev) => ({ ...prev, status: event.target.value as AgencyStatus }))} className="w-full rounded-lg border border-slate-300 px-3 py-2">
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
              <option value="SUSPENDED">SUSPENDED</option>
            </select>
          </label>

          <button type="submit" disabled={creatingAgency} className="md:col-span-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-black text-white hover:bg-slate-800 disabled:bg-slate-400">
            {creatingAgency ? "Creando agencia..." : "Crear agencia"}
          </button>
        </form>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h2 className="text-xl font-black text-slate-900">Agencias registradas</h2>
          <p className="text-xs font-semibold text-slate-500">Incluye usuarios, tours y reservas por agencia</p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-2 text-left font-bold text-slate-600">Agencia</th>
                <th className="px-3 py-2 text-left font-bold text-slate-600">Subdominio</th>
                <th className="px-3 py-2 text-left font-bold text-slate-600">Estado</th>
                <th className="px-3 py-2 text-left font-bold text-slate-600">Storefront suspendido</th>
                <th className="px-3 py-2 text-left font-bold text-slate-600">Usuarios</th>
                <th className="px-3 py-2 text-left font-bold text-slate-600">Tours / Reservas</th>
                <th className="px-3 py-2 text-left font-bold text-slate-600">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loadingAgencies ? (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center font-semibold text-slate-500">Cargando agencias...</td>
                </tr>
              ) : agencies.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center font-semibold text-slate-500">No hay agencias registradas.</td>
                </tr>
              ) : (
                agencies.map((agency) => {
                  const edit = rowEdits[agency.id] || {
                    status: agency.status,
                    suspendedStorefrontMode: agency.suspendedStorefrontMode,
                    internalSubdomain: agency.internalSubdomain || agency.slug,
                  };

                  const primaryDomain = agency.domains.find((domain) => domain.isPrimary)?.host || "-";

                  return (
                    <tr key={agency.id}>
                      <td className="px-3 py-3 text-slate-700">
                        <p className="font-extrabold text-slate-900">{agency.name}</p>
                        <p className="text-xs text-slate-500">slug: {agency.slug}</p>
                        <p className="text-xs text-slate-500">email: {agency.email || "-"}</p>
                        <p className="text-xs text-slate-500">creada: {formatDate(agency.createdAt)}</p>
                      </td>
                      <td className="px-3 py-3 text-slate-700">
                        <input
                          type="text"
                          value={edit.internalSubdomain}
                          onChange={(event) => setRowEdits((prev) => ({
                            ...prev,
                            [agency.id]: {
                              ...edit,
                              internalSubdomain: event.target.value,
                            },
                          }))}
                          className="w-full min-w-36 rounded-lg border border-slate-300 px-2 py-1"
                        />
                        <p className="mt-1 text-xs text-slate-500">Host primario: {primaryDomain}</p>
                      </td>
                      <td className="px-3 py-3 text-slate-700">
                        <select
                          value={edit.status}
                          onChange={(event) => setRowEdits((prev) => ({
                            ...prev,
                            [agency.id]: {
                              ...edit,
                              status: event.target.value as AgencyStatus,
                            },
                          }))}
                          className="rounded-lg border border-slate-300 px-2 py-1"
                        >
                          <option value="ACTIVE">ACTIVE</option>
                          <option value="INACTIVE">INACTIVE</option>
                          <option value="SUSPENDED">SUSPENDED</option>
                        </select>
                      </td>
                      <td className="px-3 py-3 text-slate-700">
                        <select
                          value={edit.suspendedStorefrontMode}
                          onChange={(event) => setRowEdits((prev) => ({
                            ...prev,
                            [agency.id]: {
                              ...edit,
                              suspendedStorefrontMode: event.target.value as SuspendedStorefrontMode,
                            },
                          }))}
                          className="rounded-lg border border-slate-300 px-2 py-1"
                        >
                          <option value="BLOCK">BLOCK</option>
                          <option value="HIDE">HIDE</option>
                        </select>
                      </td>
                      <td className="px-3 py-3 text-slate-700">
                        {agency.users.length === 0 ? (
                          <p className="text-xs text-slate-500">Sin usuarios</p>
                        ) : (
                          <div className="max-w-72 space-y-1">
                            {agency.users.slice(0, 4).map((user) => (
                              <p key={user.id} className="text-xs">
                                <span className="font-semibold">{user.role}</span>: {user.email}
                              </p>
                            ))}
                            {agency.users.length > 4 ? <p className="text-xs text-slate-500">+{agency.users.length - 4} más</p> : null}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-3 text-slate-700">
                        <p className="font-semibold">Tours: {agency.counts.tours}</p>
                        <p className="font-semibold">Reservas: {agency.counts.reservations}</p>
                      </td>
                      <td className="px-3 py-3 text-slate-700">
                        <button
                          type="button"
                          disabled={savingAgencyId === agency.id}
                          onClick={() => void saveAgencyStatus(agency.id)}
                          className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white hover:bg-slate-800 disabled:bg-slate-400"
                        >
                          {savingAgencyId === agency.id ? "Guardando..." : "Guardar cambios"}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
