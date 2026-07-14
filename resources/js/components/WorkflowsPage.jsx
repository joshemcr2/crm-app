import React from "react";
import { Workflow } from "lucide-react";

export default function WorkflowsPage() {
  return (
    <div className="flex h-full flex-col items-center justify-center p-10 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/10 ring-1 ring-violet-500/20">
        <Workflow size={20} className="text-violet-300" />
      </div>
      <h2 className="mb-1 text-sm font-semibold text-zinc-100">Automatizaciones</h2>
      <p className="max-w-md text-sm text-zinc-500">
        El motor de workflows (<code className="text-zinc-400">WorkflowEngineService</code>) ya
        funciona en el backend: puedes crear reglas directamente en la tabla{" "}
        <code className="text-zinc-400">workflows</code> (por ejemplo, vía{" "}
        <code className="text-zinc-400">php artisan tinker</code>) para que se disparen al crear
        un lead o al cambiar de etapa. Esta pantalla de administración visual todavía no está
        construida — es el siguiente paso natural del proyecto.
      </p>
    </div>
  );
}
