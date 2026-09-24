import React, { useCallback, useEffect, useState } from "react";
import { metricsApi, type FailureMetrics, type MetricsOverview, type ResponseTimesMetrics, type UptimeMetrics } from "../api/metrics";

const periods = [
  { value: 24, label: "24 horas" },
  { value: 72, label: "3 dias" },
  { value: 168, label: "7 dias" },
];

const statusStyles = {
  up: "bg-emerald-500",
  down: "bg-rose-500",
  degraded: "bg-amber-400",
  unknown: "bg-slate-400",
};

const statusLabels = {
  up: "Operacional",
  down: "Indisponível",
  degraded: "Degradado",
  unknown: "Sem dados",
};

function formatNumber(value: number | null, digits = 0) {
  if (value === null) return "--";
  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value);
}

function formatDate(value: string | null) {
  if (!value) return "Nunca";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function MetricCard({ label, value, detail, tone = "default" }: {
  label: string;
  value: string;
  detail: string;
  tone?: "default" | "good" | "bad";
}) {
  const valueColor = tone === "good"
    ? "text-emerald-500"
    : tone === "bad"
      ? "text-rose-500"
      : "text-slate-900 dark:text-white";

  return (
    <div className="card p-5">
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
      <p className={`mt-2 text-3xl font-semibold ${valueColor}`}>{value}</p>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{detail}</p>
    </div>
  );
}

export function Metrics() {
  const [overview, setOverview] = useState<MetricsOverview | null>(null);
  const [uptime, setUptime] = useState<UptimeMetrics | null>(null);
  const [responseTimes, setResponseTimes] = useState<ResponseTimesMetrics | null>(null);
  const [failures, setFailures] = useState<FailureMetrics | null>(null);
  const [period, setPeriod] = useState(24);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMetrics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [overviewData, uptimeData, responseData, failureData] = await Promise.all([
        metricsApi.overview(),
        metricsApi.uptime(),
        metricsApi.responseTimes(period),
        metricsApi.failures(),
      ]);
      setOverview(overviewData);
      setUptime(uptimeData);
      setResponseTimes(responseData);
      setFailures(failureData);
    } catch {
      setError("Não foi possível carregar as métricas.");
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  if (loading && !overview) {
    return (
      <div className="flex min-h-80 items-center justify-center">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-slate-300 border-t-teal-600" />
      </div>
    );
  }

  if (error && !overview) {
    return (
      <div className="card p-8 text-center">
        <p className="font-medium text-rose-600 dark:text-rose-400">{error}</p>
        <button onClick={loadMetrics} className="mt-4 rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800">
          Tentar novamente
        </button>
      </div>
    );
  }

  if (!overview || !uptime || !responseTimes || !failures) return null;

  const statusBreakdown = Object.entries(overview.servers.status_breakdown) as Array<[
    keyof typeof statusLabels,
    number,
  ]>;
  const maxLatency = Math.max(...responseTimes.by_server.map((item) => item.avg_ms), 1);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-teal-700 dark:text-teal-400">Observabilidade</p>
          <h1 className="mt-1 text-3xl font-bold text-slate-900 dark:text-white">Métricas</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Saúde, disponibilidade e desempenho dos teus servidores.</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="sr-only" htmlFor="metrics-period">Período da latência</label>
          <select
            id="metrics-period"
            value={period}
            onChange={(event) => setPeriod(Number(event.target.value))}
            className="rounded-lg border border-slate-200/70 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
          >
            {periods.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
          <button
            onClick={loadMetrics}
            disabled={loading}
            className="rounded-lg border border-slate-200/70 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {loading ? "A atualizar..." : "Atualizar"}
          </button>
        </div>
      </div>

      {error && <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300">{error}</div>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Taxa de sucesso" value={`${formatNumber(overview.checks_last_24h.success_rate, 1)}%`} detail={`${overview.checks_last_24h.successful} de ${overview.checks_last_24h.total} checks nas últimas 24h`} tone="good" />
        <MetricCard label="Tempo médio" value={`${formatNumber(overview.performance.avg_response_time_ms, 1)} ms`} detail={`Janela de ${responseTimes.period_hours} horas`} />
        <MetricCard label="Servidores ativos" value={formatNumber(overview.servers.active)} detail={`${overview.servers.total} configurados no total`} />
        <MetricCard label="Checks com falha" value={formatNumber(overview.checks_last_24h.failed)} detail="Timeouts, erros e respostas 5xx" tone={overview.checks_last_24h.failed ? "bad" : "good"} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
        <section className="card p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Disponibilidade por servidor</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Últimos 30 dias com base nos checks persistidos.</p>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400">{uptime.servers.length} servidores</span>
          </div>
          <div className="mt-6 space-y-5">
            {uptime.servers.length === 0 ? <p className="text-sm text-slate-500">Ainda não existem servidores ativos.</p> : uptime.servers.map((server) => (
              <div key={server.server_id}>
                <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-800 dark:text-slate-100">{server.server_name}</p>
                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">{server.total_checks} checks · último {formatDate(server.last_check)}</p>
                  </div>
                  <span className="shrink-0 font-semibold text-slate-700 dark:text-slate-200">{formatNumber(server.uptime_percentage, 2)}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div className={`h-full rounded-full ${statusStyles[server.current_status]}`} style={{ width: `${Math.min(Math.max(server.uptime_percentage, 0), 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="card p-5">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Estado atual</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Distribuição dos servidores monitorizados.</p>
          <div className="mt-6 space-y-4">
            {statusBreakdown.map(([status, count]) => (
              <div key={status} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300"><span className={`h-2.5 w-2.5 rounded-full ${statusStyles[status]}`} />{statusLabels[status]}</div>
                <span className="font-semibold text-slate-900 dark:text-white">{count}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="card p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Latência média</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Comparação por servidor no período selecionado.</p>
            </div>
            <span className="text-sm font-medium text-teal-700 dark:text-teal-400">{formatNumber(responseTimes.overall.avg_ms, 1)} ms média</span>
          </div>
          <div className="mt-6 space-y-4">
            {responseTimes.by_server.length === 0 ? <p className="text-sm text-slate-500">Ainda não existem respostas bem-sucedidas neste período.</p> : responseTimes.by_server.map((server) => (
              <div key={server.server_host}>
                <div className="mb-1 flex justify-between gap-3 text-sm"><span className="truncate text-slate-700 dark:text-slate-200">{server.server_name}</span><span className="font-medium text-slate-900 dark:text-white">{formatNumber(server.avg_ms, 1)} ms</span></div>
                <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800"><div className="h-full rounded-full bg-teal-600" style={{ width: `${Math.max((server.avg_ms / maxLatency) * 100, 3)}%` }} /></div>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">min {formatNumber(server.min_ms, 1)} ms · max {formatNumber(server.max_ms, 1)} ms · {server.check_count} checks</p>
              </div>
            ))}
          </div>
        </section>

        <section className="card p-5">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Falhas por tipo</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Últimos {failures.period_days} dias.</p>
          <div className="mt-6 grid grid-cols-3 gap-3">
            <div className="rounded-lg bg-rose-50 p-3 dark:bg-rose-950/30"><p className="text-xs text-rose-700 dark:text-rose-300">HTTP / rede</p><p className="mt-1 text-2xl font-semibold text-rose-700 dark:text-rose-300">{failures.by_type.failure}</p></div>
            <div className="rounded-lg bg-amber-50 p-3 dark:bg-amber-950/30"><p className="text-xs text-amber-700 dark:text-amber-300">Timeout</p><p className="mt-1 text-2xl font-semibold text-amber-700 dark:text-amber-300">{failures.by_type.timeout}</p></div>
            <div className="rounded-lg bg-slate-100 p-3 dark:bg-slate-800"><p className="text-xs text-slate-600 dark:text-slate-300">Erro</p><p className="mt-1 text-2xl font-semibold text-slate-700 dark:text-slate-200">{failures.by_type.error}</p></div>
          </div>
          <div className="mt-6 border-t border-slate-200/70 pt-4 dark:border-slate-800">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Servidores com mais falhas</p>
            <div className="mt-3 space-y-2">
              {failures.top_failing_servers.length === 0 ? <p className="text-sm text-slate-500">Nenhuma falha registrada.</p> : failures.top_failing_servers.slice(0, 5).map((server) => <div key={server.server__host} className="flex justify-between gap-3 text-sm"><span className="truncate text-slate-600 dark:text-slate-300">{server.server__name}</span><span className="font-semibold text-rose-600">{server.failure_count}</span></div>)}
            </div>
          </div>
        </section>
      </div>

      <section className="card overflow-hidden">
        <div className="border-b border-slate-200/70 px-5 py-4 dark:border-slate-800"><h2 className="text-lg font-semibold text-slate-900 dark:text-white">Falhas recentes</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Os últimos eventos que exigem atenção.</p></div>
        {failures.recent_failures.length === 0 ? <p className="p-5 text-sm text-slate-500">Nenhuma falha recente.</p> : <div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-900/60 dark:text-slate-400"><tr><th className="px-5 py-3 font-medium">Servidor</th><th className="px-5 py-3 font-medium">Tipo</th><th className="px-5 py-3 font-medium">Mensagem</th><th className="px-5 py-3 font-medium">Quando</th></tr></thead><tbody className="divide-y divide-slate-200/70 dark:divide-slate-800">{failures.recent_failures.map((failure, index) => <tr key={`${failure.check_timestamp}-${failure.server__host}-${index}`}><td className="px-5 py-3"><p className="font-medium text-slate-800 dark:text-slate-100">{failure.server__name}</p><p className="text-xs text-slate-500">{failure.server__host}</p></td><td className="px-5 py-3"><span className="rounded-full bg-rose-100 px-2 py-1 text-xs font-medium text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">{failure.status}</span></td><td className="max-w-sm truncate px-5 py-3 text-slate-600 dark:text-slate-300" title={failure.error_message ?? "Sem mensagem"}>{failure.error_message || "Sem mensagem"}</td><td className="whitespace-nowrap px-5 py-3 text-slate-500 dark:text-slate-400">{formatDate(failure.check_timestamp)}</td></tr>)}</tbody></table></div>}
      </section>
    </div>
  );
}
