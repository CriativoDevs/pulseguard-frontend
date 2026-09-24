import React, { useCallback, useEffect, useState } from "react";
import { type Server, serversApi } from "../api/servers";
import { ServerStatusBadge, type ServerStatusBadgeStatus } from "./ServerStatusBadge";
import { ServerFormModal } from "./ServerFormModal";
import { useServerStatusSSE } from "../hooks/useServerStatusSSE";

interface Props {
  onStatsChange?: (total: number, healthy: number, issues: number) => void;
}

function ConfirmDialog({
  name,
  onConfirm,
  onCancel,
}: {
  name: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Confirmar remoção</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Tens a certeza que queres remover <strong className="text-gray-900 dark:text-white">{name}</strong>? Esta ação não pode ser desfeita.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            Remover
          </button>
        </div>
      </div>
    </div>
  );
}

export function ServerList({ onStatsChange }: Props) {
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingServer, setEditingServer] = useState<Server | null | undefined>(undefined); // undefined = closed
  const [deletingServer, setDeletingServer] = useState<Server | null>(null);
  const { statuses, pings } = useServerStatusSSE();

  const normalizeStatus = (status: unknown): ServerStatusBadgeStatus => {
    return status === "up" || status === "down" || status === "degraded" || status === "unknown"
      ? status
      : "unknown";
  };

  const fetchServers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await serversApi.list();
      const list = Array.isArray(data) ? data : (data as any).results ?? [];
      setServers(list);
      setError(null);
    } catch {
      setError("Erro ao carregar servidores.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServers();
  }, [fetchServers]);

  // Propagate stats to Dashboard
  useEffect(() => {
    if (!onStatsChange) return;
    const healthy = servers.filter((s) => {
      const st = statuses[s.id]?.status ?? s.monitoring_status ?? "unknown";
      return st === "up";
    }).length;
    const issues = servers.filter((s) => {
      const st = statuses[s.id]?.status ?? s.monitoring_status ?? "unknown";
      return st === "down" || st === "degraded";
    }).length;
    onStatsChange(servers.length, healthy, issues);
  }, [servers, statuses, onStatsChange]);

  const handleSaved = (saved: Server) => {
    setServers((prev) => {
      const exists = prev.find((s) => s.id === saved.id);
      return exists ? prev.map((s) => (s.id === saved.id ? saved : s)) : [saved, ...prev];
    });
    setEditingServer(undefined);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingServer) return;
    try {
      await serversApi.remove(deletingServer.id);
      setServers((prev) => prev.filter((s) => s.id !== deletingServer.id));
    } catch {
      alert("Não foi possível remover o servidor.");
    } finally {
      setDeletingServer(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg p-4 text-red-800 dark:text-red-400 flex items-center justify-between">
        <span>{error}</span>
        <button onClick={fetchServers} className="text-sm underline ml-4">Tentar novamente</button>
      </div>
    );
  }

  if (servers.length === 0) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800/50 border border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-10 text-center">
        <div className="text-4xl mb-3">🖥️</div>
        <p className="text-lg font-medium text-gray-700 dark:text-gray-300">Nenhum servidor configurado</p>
        <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
          Clica em <strong>+ Adicionar Servidor</strong> para começar a monitorizar.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {servers.map((server) => {
          const status = statuses[server.id] || {};
          const currentStatus = normalizeStatus(
            status.status ?? server.monitoring_status
          );
          const ping = pings[server.id];

          return (
            <div
              key={server.id}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-gray-900 dark:text-white truncate">{server.name}</h3>
                    <ServerStatusBadge status={currentStatus} />
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    {server.protocol.toUpperCase()} · {server.host}:{server.port}
                    {server.path && server.path !== "/" ? server.path : ""}
                  </p>
                  {server.description && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{server.description}</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button
                    onClick={() => setEditingServer(server)}
                    title="Editar"
                    className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-1.414.586H9v-2a2 2 0 01.586-1.414z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setDeletingServer(server)}
                    title="Remover"
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4h6v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Stats row */}
              <div className="flex flex-wrap gap-4 mt-3 text-xs text-gray-500 dark:text-gray-400">
                {ping?.response_time != null && (
                  <span>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Resp:</span>{" "}
                    {ping.response_time.toFixed(1)}ms
                  </span>
                )}
                {ping?.loss != null && (
                  <span>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Perda:</span>{" "}
                    {ping.loss}%
                  </span>
                )}
                {(status as any).last_check && (
                  <span>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Último check:</span>{" "}
                    {new Date((status as any).last_check).toLocaleTimeString()}
                  </span>
                )}
                {(status as any).message && (
                  <span className="italic">{(status as any).message}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit/Create modal */}
      {editingServer !== undefined && (
        <ServerFormModal
          server={editingServer}
          onClose={() => setEditingServer(undefined)}
          onSaved={handleSaved}
        />
      )}

      {/* Delete confirm */}
      {deletingServer && (
        <ConfirmDialog
          name={deletingServer.name}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeletingServer(null)}
        />
      )}
    </>
  );
}
