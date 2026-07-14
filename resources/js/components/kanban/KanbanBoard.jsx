import React, { useState, useMemo, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Phone, Mail, MoreHorizontal, Clock } from "lucide-react";

/**
 * Paleta de acento por color de etapa (pastel/atenuado sobre fondo oscuro).
 * Se define aquí -y no inline- para mantener consistencia visual entre columnas.
 */
const STAGE_ACCENT = {
  slate:   "bg-slate-500/10 text-slate-300 ring-slate-500/20",
  sky:     "bg-sky-500/10 text-sky-300 ring-sky-500/20",
  amber:   "bg-amber-500/10 text-amber-300 ring-amber-500/20",
  violet:  "bg-violet-500/10 text-violet-300 ring-violet-500/20",
  emerald: "bg-emerald-500/10 text-emerald-300 ring-emerald-500/20",
  rose:    "bg-rose-500/10 text-rose-300 ring-rose-500/20",
};

const PRIORITY_DOT = {
  low: "bg-zinc-500",
  medium: "bg-amber-400",
  high: "bg-rose-400",
};

function LeadCard({ lead, isOverlay = false, onOpen }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: lead.id, data: { type: "lead", lead } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onOpen?.(lead)}
      className={[
        "group rounded-xl border border-zinc-800 bg-zinc-900/60 p-3.5",
        "shadow-sm shadow-black/20 backdrop-blur-sm",
        "transition-all duration-150 hover:border-zinc-700 hover:bg-zinc-900",
        "cursor-grab active:cursor-grabbing",
        isOverlay ? "rotate-2 border-zinc-700 shadow-xl shadow-black/40" : "",
      ].join(" ")}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={`h-1.5 w-1.5 rounded-full ${PRIORITY_DOT[lead.priority]}`} />
          <p className="text-sm font-medium text-zinc-100">{lead.name}</p>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onOpen?.(lead); }}
          className="rounded-md p-1 text-zinc-500 opacity-0 transition-opacity hover:bg-zinc-800 hover:text-zinc-300 group-hover:opacity-100"
        >
          <MoreHorizontal size={14} />
        </button>
      </div>

      {lead.company && (
        <p className="mb-3 text-xs text-zinc-500">{lead.company}</p>
      )}

      <div className="mb-3 flex items-center gap-3 text-zinc-500">
        {lead.email && <Mail size={13} className="shrink-0" />}
        {lead.phone && <Phone size={13} className="shrink-0" />}
        {lead.last_activity_at && (
          <span className="flex items-center gap-1 text-[11px]">
            <Clock size={11} />
            {lead.last_activity_at}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-emerald-400">
          {new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(lead.value)}
        </span>
        {lead.assignee && (
          <div
            title={lead.assignee.name}
            className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-800 text-[10px] font-medium text-zinc-300 ring-1 ring-zinc-700"
          >
            {lead.assignee.name.slice(0, 2).toUpperCase()}
          </div>
        )}
      </div>
    </div>
  );
}

function StageColumn({ stage, onOpenLead }) {
  const leadIds = useMemo(() => stage.leads.map((l) => l.id), [stage.leads]);
  const accent = STAGE_ACCENT[stage.color] ?? STAGE_ACCENT.slate;

  return (
    <div className="flex w-72 shrink-0 flex-col rounded-2xl bg-zinc-950/40">
      <div className="mb-3 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${accent}`}>
            {stage.name}
          </span>
          <span className="text-xs text-zinc-600">{stage.leads.length}</span>
        </div>
      </div>

      <SortableContext items={leadIds} strategy={verticalListSortingStrategy}>
        <div className="flex min-h-[120px] flex-col gap-2 rounded-xl p-1">
          {stage.leads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} onOpen={onOpenLead} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}

export default function KanbanBoard({ initialStages, onMoveLead, onOpenLead }) {
  const [stages, setStages] = useState(initialStages);
  const [activeLead, setActiveLead] = useState(null);

  // Si el padre vuelve a pedir el tablero (ej. tras editar un lead en el modal)
  // y nos pasa un arreglo nuevo, resincronizamos el estado local.
  React.useEffect(() => {
    setStages(initialStages);
  }, [initialStages]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const findStageOfLead = useCallback(
    (leadId) => stages.find((s) => s.leads.some((l) => l.id === leadId)),
    [stages]
  );

  const handleDragStart = (event) => {
    const stage = findStageOfLead(event.active.id);
    setActiveLead(stage?.leads.find((l) => l.id === event.active.id) ?? null);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveLead(null);
    if (!over) return;

    const sourceStage = findStageOfLead(active.id);
    const destStage =
      stages.find((s) => s.id === over.data?.current?.stageId) ??
      findStageOfLead(over.id) ??
      sourceStage;

    if (!sourceStage || !destStage) return;

    const destIndex = destStage.leads.findIndex((l) => l.id === over.id);
    const newPosition = destIndex === -1 ? destStage.leads.length : destIndex;

    // Actualización optimista de la UI
    setStages((prev) => {
      const next = prev.map((s) => ({ ...s, leads: [...s.leads] }));
      const from = next.find((s) => s.id === sourceStage.id);
      const to = next.find((s) => s.id === destStage.id);
      const [moved] = from.leads.splice(from.leads.findIndex((l) => l.id === active.id), 1);
      to.leads.splice(newPosition, 0, moved);
      return next;
    });

    // Persistencia en backend: PATCH /api/leads/{id}/move
    try {
      await onMoveLead(active.id, { stageId: destStage.id, position: newPosition });
    } catch (err) {
      console.error("No se pudo mover el lead, revirtiendo UI", err);
      setStages(initialStages); // rollback simple ante error de red
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto px-6 py-4">
        {stages.map((stage) => (
          <StageColumn key={stage.id} stage={stage} onOpenLead={onOpenLead} />
        ))}
      </div>

      <DragOverlay>
        {activeLead ? <LeadCard lead={activeLead} isOverlay /> : null}
      </DragOverlay>
    </DndContext>
  );
}
