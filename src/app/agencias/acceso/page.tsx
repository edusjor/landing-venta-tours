"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

type AccessMode = "login" | "signup";

function normalizeSlug(input: string): string {
  return String(input ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function AgencyAccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = useMemo<AccessMode>(() => {
    return searchParams?.get("mode") === "signup" ? "signup" : "login";
  }, [searchParams]);

  const [mode, setMode] = useState<AccessMode>(initialMode);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginAgencySlug, setLoginAgencySlug] = useState("");

  const [agencyName, setAgencyName] = useState("");
  const [agencySlug, setAgencySlug] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: loginEmail,
          password: loginPassword,
          agencySlug: normalizeSlug(loginAgencySlug),
        }),
      });

      const payload = await res.json().catch(() => null);
      if (!res.ok) {
        setError(payload?.error || "No se pudo iniciar sesión.");
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch {
      setError("Error de red. Intenta nuevamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const normalizedSlug = normalizeSlug(agencySlug);
      const res = await fetch("/api/agencies/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agencyName,
          agencySlug: normalizedSlug,
          ownerName,
          ownerEmail,
          password: registerPassword,
          internalSubdomain: normalizedSlug,
        }),
      });

      const payload = await res.json().catch(() => null);
      if (!res.ok) {
        setError(payload?.error || "No se pudo crear la cuenta.");
        return;
      }

      router.push(payload?.redirectTo || "/admin");
      router.refresh();
    } catch {
      setError("Error de red. Intenta nuevamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.17),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(245,158,11,0.18),transparent_30%),linear-gradient(180deg,#f8fbfa_0%,#eef5f2_100%)] py-14">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 lg:grid-cols-[1.05fr_0.95fr]">
        <article className="rounded-3xl border border-emerald-100 bg-white/90 p-7 shadow-[0_24px_64px_rgba(20,60,70,0.14)] backdrop-blur">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">Portal para agencias</p>
          <h1 className="mt-3 text-4xl font-black text-slate-900 md:text-5xl">Vende tus tours en minutos</h1>
          <p className="mt-4 text-sm font-semibold leading-7 text-slate-600 md:text-base">
            Crea tu cuenta, configura tu agencia y administra tu catálogo desde el panel interno.
            Este acceso está pensado para agencias que quieren operar su propio storefront dentro de la plataforma.
          </p>

          <div className="mt-6 grid gap-3 text-sm font-semibold text-slate-700 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              Alta rápida de agencia y owner
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              Dominio/subdominio listo para escalar
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              Panel administrativo por agencia
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              Reservas y pagos desde un solo lugar
            </div>
          </div>

          <div className="mt-7 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => {
                setMode("signup");
                setError("");
              }}
              className={`rounded-xl px-4 py-2 text-sm font-black transition ${mode === "signup" ? "bg-emerald-700 text-white" : "bg-white text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-50"}`}
            >
              Crear cuenta
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setError("");
              }}
              className={`rounded-xl px-4 py-2 text-sm font-black transition ${mode === "login" ? "bg-slate-900 text-white" : "bg-white text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50"}`}
            >
              Iniciar sesión
            </button>
            <Link href="/" className="rounded-xl bg-white px-4 py-2 text-sm font-black text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50">
              Volver al inicio
            </Link>
          </div>

          <p className="mt-4 text-xs text-slate-500">
            Nota temporal: este flujo es simple (sin capa fuerte de seguridad todavía), ideal para pruebas y onboarding inicial.
          </p>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-7 shadow-lg shadow-slate-300/30">
          {mode === "signup" ? (
            <>
              <h2 className="text-2xl font-black text-slate-900">Crear cuenta de agencia</h2>
              <p className="mt-2 text-sm font-medium text-slate-600">Tu agencia se crea y quedas autenticado para entrar al panel.</p>

              <form className="mt-5 grid gap-3" onSubmit={handleSignup}>
                <label className="text-sm font-bold text-slate-700">
                  Nombre de agencia
                  <input
                    value={agencyName}
                    onChange={(event) => setAgencyName(event.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"
                    required
                  />
                </label>

                <label className="text-sm font-bold text-slate-700">
                  Slug de agencia
                  <input
                    value={agencySlug}
                    onChange={(event) => setAgencySlug(event.target.value)}
                    placeholder="mi-agencia"
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"
                    required
                  />
                </label>

                <label className="text-sm font-bold text-slate-700">
                  Nombre del owner
                  <input
                    value={ownerName}
                    onChange={(event) => setOwnerName(event.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"
                    required
                  />
                </label>

                <label className="text-sm font-bold text-slate-700">
                  Correo del owner
                  <input
                    type="email"
                    value={ownerEmail}
                    onChange={(event) => setOwnerEmail(event.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"
                    required
                  />
                </label>

                <label className="text-sm font-bold text-slate-700">
                  Contraseña
                  <input
                    type="password"
                    value={registerPassword}
                    onChange={(event) => setRegisterPassword(event.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"
                    minLength={4}
                    required
                  />
                </label>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="mt-1 rounded-xl bg-emerald-700 px-4 py-2 font-bold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isLoading ? "Creando..." : "Crear cuenta y entrar"}
                </button>
              </form>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-black text-slate-900">Iniciar sesión de agencia</h2>
              <p className="mt-2 text-sm font-medium text-slate-600">Usa tu correo owner y contraseña para abrir el panel.</p>

              <form className="mt-5 grid gap-3" onSubmit={handleLogin}>
                <label className="text-sm font-bold text-slate-700">
                  Correo o usuario
                  <input
                    value={loginEmail}
                    onChange={(event) => setLoginEmail(event.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"
                    required
                  />
                </label>

                <label className="text-sm font-bold text-slate-700">
                  Contraseña
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(event) => setLoginPassword(event.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"
                    required
                  />
                </label>

                <label className="text-sm font-bold text-slate-700">
                  Slug de agencia (opcional)
                  <input
                    value={loginAgencySlug}
                    onChange={(event) => setLoginAgencySlug(event.target.value)}
                    placeholder="mi-agencia"
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"
                  />
                </label>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="mt-1 rounded-xl bg-slate-900 px-4 py-2 font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isLoading ? "Ingresando..." : "Entrar al panel"}
                </button>
              </form>
            </>
          )}

          {error ? <p className="mt-4 rounded-xl bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">{error}</p> : null}
        </article>
      </div>
    </section>
  );
}
