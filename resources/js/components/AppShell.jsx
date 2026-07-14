import React, { useEffect, useRef, useState } from "react";
import {
  Users, KanbanSquare, Workflow, Settings,
  ChevronsLeft, Search, Command, Loader2, LogOut,
} from "lucide-react";
import { api } from "../lib/api";

const NAV_ITEMS = [
  { key: "pipeline", label: "Pipeline", icon: KanbanSquare },
  { key: "leads", label: "Leads", icon: Users },
  { key: "workflows", label: "Automatizaciones", icon: Workflow },
  { key: "settings", label: "Ajustes", icon: Settings },
];

export default function AppShell({ children, activeView, onNavigate, onSelectLead, onLogout }) {
  const [collapsed, setCollapsed] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandOpen(true);
      }
      if (e.key === "Escape") setCommandOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (!commandOpen) {
      setQuery("");
      setResults([]);
      return;
    }
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setSearching(true);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await api.get(`/api/leads?search=${encodeURIComponent(query)}&per_page=8`);
        setResults(res.data ?? []);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(debounceRef.current);
  }, [query, commandOpen]);

  const handleSelectResult = (lead) => {
    setCommandOpen(false);
    onSelectLead?.(lead);
  };

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-200">
      {/* Sidebar */}
      <aside
        className={[
          "flex flex-col border-r border-zinc-900 bg-zinc-950/80 transition-all duration-300 ease-out",
          collapsed ? "w-[68px]" : "w-64",
        ].join(" ")}
      >
        <div className="flex items-center justify-between px-4 py-4">
          {!collapsed && <span className="text-sm font-semibold tracking-tight text-zinc-100">CRM Operativo</span>}
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-zinc-900 hover:text-zinc-300"
          >
            <ChevronsLeft size={16} className={collapsed ? "rotate-180 transition-transform" : "transition-transform"} />
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-1 px-2">
          {NAV_ITEMS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => onNavigate?.(key)}
              className={[
                "flex items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                activeView === key
                  ? "bg-zinc-900 text-zinc-100"
                  : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100",
              ].join(" ")}
            >
              <Icon size={17} className="shrink-0" />
              {!collapsed && <span>{label}</span>}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex items-center justify-between border-b border-zinc-900 px-6 py-3">
          <button
            onClick={() => setCommandOpen(true)}
            className="flex w-80 items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-1.5 text-sm text-zinc-500 transition-colors hover:border-zinc-700"
          >
            <Search size={14} />
            <span className="flex-1 text-left">Buscar leads, empresas...</span>
            <kbd className="flex items-center gap-0.5 rounded border border-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-500">
              <Command size={10} />K
            </kbd>
          </button>

          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-zinc-500 transition-colors hover:bg-zinc-900 hover:text-zinc-300"
          >
            <LogOut size={14} /> Cerrar sesión
          </button>
        </header>

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>

      {commandOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 pt-32 backdrop-blur-sm"
          onClick={() => setCommandOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-xl border border-zinc-800 bg-zinc-900 p-2 shadow-2xl shadow-black/50"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 px-2">
              <Search size={14} className="text-zinc-500" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por nombre, empresa o email..."
                className="w-full rounded-lg bg-transparent px-1 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-600"
              />
              {searching && <Loader2 size={14} className="animate-spin text-zinc-500" />}
            </div>

            {results.length > 0 && (
              <div className="mt-1 max-h-72 overflow-y-auto border-t border-zinc-800">
                {results.map((lead) => (
                  <button
                    key={lead.id}
                    onClick={() => handleSelectResult(lead)}
                    className="flex w-full flex-col items-start gap-0.5 rounded-lg px-3 py-2 text-left hover:bg-zinc-800"
                  >
                    <span className="text-sm text-zinc-100">{lead.name}</span>
                    <span className="text-xs text-zinc-500">{lead.company || lead.email || "Sin datos adicionales"}</span>
                  </button>
                ))}
              </div>
            )}

            {!searching && query.trim() && results.length === 0 && (
              <p className="px-3 py-3 text-xs text-zinc-600">No se encontraron leads para "{query}".</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
