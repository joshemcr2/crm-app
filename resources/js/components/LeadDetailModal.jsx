import React, { useEffect, useState } from "react";
import { X, Trash2, Save, Loader2 } from "lucide-react";
import { api } from "../lib/api";

const PRIORITY_LABEL = { low: "Baja", medium: "Media", high: "Alta" };

export default function LeadDetailModal({ leadId, onClose, onChanged }) {
  const [lead, setLead] = useState(null);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [noteText, setNoteText] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.get(`/api/leads/${leadId}`)
      .then(({ data }) => {
        if (cancelled) return;
        setLead(data);
        setForm({
          name: data.name ?? "",
          company: data.company ?? "",
          email: data.email ?? "",
          phone: data.phone ?? "",
          value: data.value ?? 0,
          priority: data.priority ?? "medium",
        });
      })
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [leadId]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await api.patch(`/api/leads/${leadId}`, form);
      onChanged?.();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`¿Eliminar a "${lead?.name}"? Esta acción no se puede deshacer.`)) return;
    setSaving(true);
    try {
      await api.delete(`/api/leads/${leadId}`);
      onChanged?.();
      onClose();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  const handleAddNote = async () => {
    if (!noteText.trim()) return;
    try {
      await api.post(`/api/leads/${leadId}/interactions`, {
        type: "note",
        title: noteText.slice(0, 60),
        description: noteText,
      });
      setNoteText("");
      const { data } = await api.get(`/api/leads/${leadId}`);
      setLead(data);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl shadow-black/50"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
          <h2 className="text-sm font-semibold text-zinc-100">
            {loading ? "Cargando..." : lead?.name}
          </h2>
          <button onClick={onClose} className="rounded-md p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {loading && <p className="text-sm text-zinc-500">Cargando lead...</p>}

          {!loading && form && (
            <div className="space-y-4">
              {error && (
                <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
                  {error}
                </p>
              )}

              <div className="grid grid-cols-2 gap-3">
                <Field label="Nombre" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
                <Field label="Empresa" value={form.company} onChange={(v) => setForm({ ...form, company: v })} />
                <Field label="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
                <Field label="Teléfono" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
                <Field
                  label="Valor (€)"
                  type="number"
                  value={form.value}
                  onChange={(v) => setForm({ ...form, value: v })}
                />
                <div>
                  <label className="mb-1 block text-xs text-zinc-500">Prioridad</label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 text-sm text-zinc-100 outline-none focus:border-zinc-600"
                  >
                    {Object.entries(PRIORITY_LABEL).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="border-t border-zinc-800 pt-4">
                <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Historial de interacciones
                </h3>
                <div className="mb-3 flex gap-2">
                  <input
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Agregar una nota..."
                    className="flex-1 rounded-lg border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 text-sm text-zinc-100 outline-none focus:border-zinc-600"
                  />
                  <button
                    onClick={handleAddNote}
                    className="rounded-lg bg-zinc-800 px-3 text-sm text-zinc-200 hover:bg-zinc-700"
                  >
                    Añadir
                  </button>
                </div>
                <div className="max-h-40 space-y-2 overflow-y-auto">
                  {(lead?.interactions ?? []).length === 0 && (
                    <p className="text-xs text-zinc-600">Sin interacciones registradas todavía.</p>
                  )}
                  {(lead?.interactions ?? []).map((it) => (
                    <div key={it.id} className="rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-xs">
                      <p className="font-medium text-zinc-300">{it.title}</p>
                      {it.description && <p className="mt-0.5 text-zinc-500">{it.description}</p>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {!loading && form && (
          <div className="flex items-center justify-between border-t border-zinc-800 px-5 py-3">
            <button
              onClick={handleDelete}
              disabled={saving}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-rose-400 hover:bg-rose-500/10 disabled:opacity-50"
            >
              <Trash2 size={13} /> Eliminar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600/90 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-emerald-600 disabled:opacity-50"
            >
              {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
              Guardar cambios
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }) {
  return (
    <div>
      <label className="mb-1 block text-xs text-zinc-500">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 text-sm text-zinc-100 outline-none focus:border-zinc-600"
      />
    </div>
  );
}
