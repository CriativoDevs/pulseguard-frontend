import React, { useEffect, useState } from "react";
import { type Server, type ServerPayload, serversApi } from "../api/servers";

interface Props {
  server?: Server | null; // null = create mode, Server = edit mode
  onClose: () => void;
  onSaved: (server: Server) => void;
}

const PROTOCOLS = ["http", "https", "tcp", "ping", "icmp"] as const;

const defaultForm = (): ServerPayload => ({
  name: "",
  description: "",
  protocol: "https",
  host: "",
  port: 443,
  path: "/",
  check_interval: 60,
  timeout: 10,
  notify_on_failure: true,
  notify_recovery: true,
});

export function ServerFormModal({ server, onClose, onSaved }: Props) {
  const isEdit = !!server;
  const [form, setForm] = useState<ServerPayload>(
    server
      ? {
          name: server.name,
          description: server.description ?? "",
          protocol: server.protocol,
          host: server.host,
          port: server.port,
          path: server.path ?? "/",
          check_interval: server.check_interval ?? 60,
          timeout: server.timeout ?? 10,
          notify_on_failure: server.notify_on_failure ?? true,
          notify_recovery: server.notify_recovery ?? true,
        }
      : defaultForm()
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const set = <K extends keyof ServerPayload>(key: K, value: ServerPayload[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      const payload: ServerPayload = {
        ...form,
        // Strip empty optional strings so backend doesn't complain
        description: form.description || undefined,
        path: form.path || undefined,
        // Never send tags — backend defaults to blank
      };
      delete (payload as any).tags;

      const saved = isEdit
        ? await serversApi.update(server!.id, payload)
        : await serversApi.create(payload);
      onSaved(saved);
    } catch (err: any) {
      const status = err.response?.status;
      const data = err.response?.data;

      if (status === 401) {
        setError("A sessão expirou. Por favor faz login novamente.");
      } else if (status === 403) {
        setError("Não tens permissão para realizar esta ação.");
      } else if (status === 400 && data && typeof data === "object") {
        // Collect field-level validation errors
        const msgs = Object.entries(data)
          .flatMap(([field, errs]) => {
            const list = Array.isArray(errs) ? errs : [errs];
            const fieldLabel = field === "non_field_errors" ? "" : `${field}: `;
            return list.map((e) => `${fieldLabel}${e}`);
          })
          .join(" · ");
        setError(msgs || "Dados inválidos. Verifica os campos e tenta novamente.");
      } else if (!navigator.onLine) {
        setError("Sem ligação à internet. Verifica a tua rede e tenta novamente.");
      } else {
        setError("Ocorreu um erro inesperado. Tenta novamente em breve.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {isEdit ? "Editar Servidor" : "Novo Servidor"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg p-3 text-sm text-red-700 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {/* Name */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nome <span className="text-red-500">*</span>
              </label>
              <input
                required
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Meu servidor"
              />
            </div>

            {/* Protocol */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Protocolo
              </label>
              <select
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                value={form.protocol}
                onChange={(e) => set("protocol", e.target.value as ServerPayload["protocol"])}
              >
                {PROTOCOLS.map((p) => (
                  <option key={p} value={p}>{p.toUpperCase()}</option>
                ))}
              </select>
            </div>

            {/* Port */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Porta <span className="text-red-500">*</span>
              </label>
              <input
                required
                type="number"
                min={1}
                max={65535}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                value={form.port}
                onChange={(e) => set("port", Number(e.target.value))}
              />
            </div>

            {/* Host */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Host <span className="text-red-500">*</span>
              </label>
              <input
                required
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                value={form.host}
                onChange={(e) => set("host", e.target.value)}
                placeholder="example.com"
              />
            </div>

            {/* Path */}
            {(form.protocol === "http" || form.protocol === "https") && (
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Path
                </label>
                <input
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  value={form.path ?? "/"}
                  onChange={(e) => set("path", e.target.value)}
                  placeholder="/health"
                />
              </div>
            )}

            {/* Description */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Descrição
              </label>
              <input
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                value={form.description ?? ""}
                onChange={(e) => set("description", e.target.value)}
                placeholder="Descrição opcional"
              />
            </div>

            {/* Interval + Timeout */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Intervalo (s)
              </label>
              <input
                type="number"
                min={10}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                value={form.check_interval ?? 60}
                onChange={(e) => set("check_interval", Number(e.target.value))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Timeout (s)
              </label>
              <input
                type="number"
                min={1}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                value={form.timeout ?? 10}
                onChange={(e) => set("timeout", Number(e.target.value))}
              />
            </div>

            {/* Toggles */}
            <div className="col-span-2 flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.notify_on_failure ?? true}
                  onChange={(e) => set("notify_on_failure", e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Notificar falha</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.notify_recovery ?? true}
                  onChange={(e) => set("notify_recovery", e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Notificar recuperação</span>
              </label>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit as any}
            disabled={saving}
            className="px-5 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors shadow-sm"
          >
            {saving ? "Guardando..." : isEdit ? "Guardar alterações" : "Adicionar servidor"}
          </button>
        </div>
      </div>
    </div>
  );
}
