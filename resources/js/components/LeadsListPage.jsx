import React, { useEffect, useState } from "react";
import { Plus, Search } from "lucide-react";
import { api } from "../lib/api";

const PRIORITY_BADGE = {
  low: "bg-zinc-500/10 text-zinc-400 ring-zinc-500/20",
  medium: "bg-amber-500/10 text-amber-300 ring-amber-500/20",
  high: "bg-rose-500/10 text-rose-300 ring-rose-500/20",
};

export default function LeadsListPage({ onOpenLead, onCreateLead, refreshToken }) {
  const [leads, setLeads] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const timeout = setTimeout(async () => {
      try {
        const query = search.trim() ? `?search=${encodeURIComponent(search)}` : "";
        const res = await api.get(`/api/leads${query}`);
        if (!cancelled) setLeads(res.data ?? []);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 250);

    return () => { cancelled = true; clearTimeout(timeout); };
  }, [search, refreshToken]);

  return (
    <div className="p-6">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div className="relative w-80">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, empresa o email..."
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900/60 py-1.5 pl-8 pr-3 text-sm text-zinc-100 outline-none focus:border-zinc-600"
          />
        </div>
        <button
          onClick={onCreateLead}
          className="flex items-center gap-1.5 rounded-lg bg-emerald-600/90 px-3.5 py-1.5 text-sm font-medium text-white hover:bg-emerald-600"
        >
          <Plus size={15} /> Nuevo Lead
        </button>
      </div>

      {error && <p className="mb-3 text-sm text-rose-400">{error}</p>}

      <div className="overflow-hidden rounded-xl border border-zinc-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-900/60 text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-4 py-2.5">Nombre</th>
              <th className="px-4 py-2.5">Empresa</th>
              <th className="px-4 py-2.5">Etapa</th>
              <th className="px-4 py-2.5">Prioridad</th>
              <th className="px-4 py-2.5 text-right">Valor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-900">
            {loading && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-zinc-600">Cargando...</td></tr>
            )}
            {!loading && leads.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-zinc-600">No se encontraron leads.</td></tr>
            )}
            {!loading && leads.map((lead) => (
              <tr
                key={lead.id}
                onClick={() => onOpenLead(lead.id)}
                className="cursor-pointer bg-zinc-950/40 transition-colors hover:bg-zinc-900/60"
              >
                <td className="px-4 py-2.5 font-medium text-zinc-100">{lead.name}</td>
                <td className="px-4 py-2.5 text-zinc-400">{lead.company ?? "—"}</td>
                <td className="px-4 py-2.5 text-zinc-400">{lead.stage?.name ?? "—"}</td>
                <td className="px-4 py-2.5">
                  <span className={`rounded-full px-2 py-0.5 text-xs ring-1 ring-inset ${PRIORITY_BADGE[lead.priority] ?? PRIORITY_BADGE.medium}`}>
                    {lead.priority}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right font-semibold text-emerald-400">
                  {new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(lead.value ?? 0)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
