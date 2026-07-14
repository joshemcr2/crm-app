import React from "react";
import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="flex h-full flex-col items-center justify-center p-10 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-800 ring-1 ring-zinc-700">
        <Settings size={20} className="text-zinc-300" />
      </div>
      <h2 className="mb-1 text-sm font-semibold text-zinc-100">Ajustes</h2>
      <p className="max-w-md text-sm text-zinc-500">
        Pantalla pendiente: aquí irían las credenciales de Mailgun/Twilio, gestión de
        usuarios y preferencias del pipeline. Hoy esas credenciales se configuran
        directamente en el <code className="text-zinc-400">.env</code> del servidor.
      </p>
    </div>
  );
}
