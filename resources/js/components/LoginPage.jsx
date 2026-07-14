import React, { useState } from "react";
import { Loader2, LogIn, UserPlus } from "lucide-react";
import { api, primeCsrfCookie } from "../lib/api";

export default function LoginPage({ onAuthenticated }) {
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [form, setForm] = useState({ name: "", email: "", password: "", password_confirmation: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await primeCsrfCookie();
      if (mode === "login") {
        await api.post("/api/login", { email: form.email, password: form.password });
      } else {
        await api.post("/api/register", form);
      }
      onAuthenticated();
    } catch (err) {
      setError(err.error?.message || err.message || "No se pudo autenticar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-zinc-950 p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 shadow-2xl shadow-black/40 backdrop-blur-sm"
      >
        <h1 className="mb-1 text-lg font-semibold text-zinc-100">CRM Operativo</h1>
        <p className="mb-6 text-sm text-zinc-500">
          {mode === "login" ? "Inicia sesión para continuar" : "Crea una cuenta nueva"}
        </p>

        {error && (
          <p className="mb-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
            {error}
          </p>
        )}

        <div className="space-y-3">
          {mode === "register" && (
            <input
              required
              placeholder="Nombre completo"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-600"
            />
          )}
          <input
            required
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-600"
          />
          <input
            required
            type="password"
            placeholder="Contraseña"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-600"
          />
          {mode === "register" && (
            <input
              required
              type="password"
              placeholder="Confirmar contraseña"
              value={form.password_confirmation}
              onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-600"
            />
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600/90 py-2 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-50"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : mode === "login" ? <LogIn size={14} /> : <UserPlus size={14} />}
          {mode === "login" ? "Iniciar sesión" : "Crear cuenta"}
        </button>

        <button
          type="button"
          onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(null); }}
          className="mt-3 w-full text-center text-xs text-zinc-500 hover:text-zinc-300"
        >
          {mode === "login" ? "¿No tienes cuenta? Regístrate" : "¿Ya tienes cuenta? Inicia sesión"}
        </button>

        {mode === "login" && (
          <p className="mt-4 rounded-lg bg-zinc-950/60 px-3 py-2 text-center text-[11px] text-zinc-600">
            Demo: demo@crm-operativo.test / password
          </p>
        )}
      </form>
    </div>
  );
}
