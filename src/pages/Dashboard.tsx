import React, { useCallback, useState } from "react";
import { ServerList } from "../components/ServerList";
import { ServerFormModal } from "../components/ServerFormModal";
import { client } from "../api/client";

export function Dashboard() {
  const [runningChecks, setRunningChecks] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0); // force ServerList re-mount after add
  const [stats, setStats] = useState({ total: 0, healthy: 0, issues: 0 });
  const handleStatsChange = useCallback((total: number, healthy: number, issues: number) => {
    setStats({ total, healthy, issues });
  }, []);

  const handleRunChecks = async () => {
    try {
      setRunningChecks(true);
      await client.post("/checks/run/");
    } catch (err) {
      console.error("Error running checks:", err);
    } finally {
      setRunningChecks(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRunChecks}
            disabled={runningChecks}
            className="px-4 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            {runningChecks ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                A verificar…
              </span>
            ) : "▶ Verificar agora"}
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-sm flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Adicionar Servidor
          </button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Total de Servidores</p>
          <p className="text-4xl font-bold text-gray-900 dark:text-white mt-2">{stats.total}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
          <p className="text-sm text-green-600 dark:text-green-400 font-medium">Saudáveis</p>
          <p className="text-4xl font-bold text-green-600 dark:text-green-400 mt-2">{stats.healthy}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
          <p className="text-sm text-red-500 dark:text-red-400 font-medium">Com Problemas</p>
          <p className="text-4xl font-bold text-red-500 dark:text-red-400 mt-2">{stats.issues}</p>
        </div>
      </div>

      {/* Server list */}
      <div>
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Servidores</h2>
        <ServerList
          key={refreshKey}
          onStatsChange={handleStatsChange}
        />
      </div>

      {/* Add server modal */}
      {showAddModal && (
        <ServerFormModal
          server={null}
          onClose={() => setShowAddModal(false)}
          onSaved={() => {
            setShowAddModal(false);
            setRefreshKey((k) => k + 1);
          }}
        />
      )}
    </div>
  );
}
