import React, { useCallback, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import AppShell from "./components/AppShell";
import KanbanBoard from "./components/kanban/KanbanBoard";
import LeadsListPage from "./components/LeadsListPage";
import WorkflowsPage from "./components/WorkflowsPage";
import SettingsPage from "./components/SettingsPage";
import LeadDetailModal from "./components/LeadDetailModal";
import NewLeadModal from "./components/NewLeadModal";
import LoginPage from "./components/LoginPage";
import { api, primeCsrfCookie } from "./lib/api";

const PIPELINE_ID = 1;
const BOARD_ENDPOINT = `/api/pipelines/${PIPELINE_ID}/board`;

function PipelinePage({ onOpenLead, refreshToken }) {
  const [stages, setStages] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get(BOARD_ENDPOINT);
      setStages(data);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => { load(); }, [load, refreshToken]);

  const handleMoveLead = async (leadId, { stageId, position }) => {
    await api.patch(`/api/leads/${leadId}/move`, { stage_id: stageId, position });
  };

  if (error) {
    return (
      <div className="p-8 text-sm text-rose-400">
        No se pudo cargar el tablero: {error}. Verifica que hayas ejecutado
        <code className="text-zinc-300"> php artisan migrate --seed</code> y que
        el pipeline con id {PIPELINE_ID} exista.
      </div>
    );
  }

  if (!stages) {
    return <div className="p-8 text-sm text-zinc-500">Cargando pipeline...</div>;
  }

  return <KanbanBoard initialStages={stages} onMoveLead={handleMoveLead} onOpenLead={(lead) => onOpenLead(lead.id)} />;
}

function Dashboard({ onLogout }) {
  const [view, setView] = useState("pipeline");
  const [selectedLeadId, setSelectedLeadId] = useState(null);
  const [creatingLead, setCreatingLead] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);
  const [defaultStageId, setDefaultStageId] = useState(null);

  useEffect(() => {
    api.get(BOARD_ENDPOINT)
      .then(({ data }) => setDefaultStageId(data?.[0]?.id ?? null))
      .catch(() => {});
  }, [refreshToken]);

  const bumpRefresh = () => setRefreshToken((t) => t + 1);

  return (
    <AppShell
      activeView={view}
      onNavigate={setView}
      onSelectLead={(lead) => setSelectedLeadId(lead.id)}
      onLogout={onLogout}
    >
      {view === "pipeline" && <PipelinePage onOpenLead={setSelectedLeadId} refreshToken={refreshToken} />}
      {view === "leads" && (
        <LeadsListPage
          onOpenLead={setSelectedLeadId}
          onCreateLead={() => setCreatingLead(true)}
          refreshToken={refreshToken}
        />
      )}
      {view === "workflows" && <WorkflowsPage />}
      {view === "settings" && <SettingsPage />}

      {selectedLeadId && (
        <LeadDetailModal
          leadId={selectedLeadId}
          onClose={() => setSelectedLeadId(null)}
          onChanged={bumpRefresh}
        />
      )}

      {creatingLead && (
        <NewLeadModal
          pipelineId={PIPELINE_ID}
          stageId={defaultStageId}
          onClose={() => setCreatingLead(false)}
          onCreated={bumpRefresh}
        />
      )}
    </AppShell>
  );
}

function App() {
  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  const checkSession = useCallback(async () => {
    setChecking(true);
    try {
      await primeCsrfCookie();
      await api.get("/api/me");
      setAuthenticated(true);
    } catch {
      setAuthenticated(false);
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => { checkSession(); }, [checkSession]);

  const handleLogout = async () => {
    try { await api.post("/api/logout"); } catch { /* ignora si ya expiró */ }
    setAuthenticated(false);
  };

  if (checking) {
    return <div className="flex h-screen items-center justify-center bg-zinc-950 text-sm text-zinc-500">Cargando...</div>;
  }

  if (!authenticated) {
    return <LoginPage onAuthenticated={() => setAuthenticated(true)} />;
  }

  return <Dashboard onLogout={handleLogout} />;
}

createRoot(document.getElementById("app")).render(<App />);
