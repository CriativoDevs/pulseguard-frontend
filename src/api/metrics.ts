import { client } from "./client";

export interface MetricsOverview {
  servers: {
    total: number;
    active: number;
    inactive: number;
    status_breakdown: Record<"up" | "down" | "degraded" | "unknown", number>;
  };
  checks_last_24h: {
    total: number;
    successful: number;
    failed: number;
    success_rate: number;
  };
  performance: {
    avg_response_time_ms: number | null;
  };
}

export interface UptimeServerMetric {
  server_id: number;
  server_name: string;
  url: string;
  uptime_percentage: number;
  total_checks: number;
  successful_checks: number;
  current_status: "up" | "down" | "degraded" | "unknown";
  last_check: string | null;
}

export interface UptimeMetrics {
  servers: UptimeServerMetric[];
}

export interface ResponseTimesMetrics {
  period_hours: number;
  overall: {
    avg_ms: number | null;
    min_ms: number | null;
    max_ms: number | null;
    total_checks: number;
  };
  by_server: Array<{
    server_name: string;
    server_host: string;
    avg_ms: number;
    min_ms: number;
    max_ms: number;
    check_count: number;
  }>;
}

export interface FailureMetric {
  server__name: string;
  server__host: string;
  status: "failure" | "timeout" | "error";
  error_message: string | null;
  check_timestamp: string;
  response_time: number | null;
}

export interface FailureMetrics {
  period_days: number;
  total_failures: number;
  by_type: {
    failure: number;
    timeout: number;
    error: number;
  };
  recent_failures: FailureMetric[];
  top_failing_servers: Array<{
    server__name: string;
    server__host: string;
    failure_count: number;
  }>;
}

export const metricsApi = {
  overview: () => client.get<MetricsOverview>("/metrics/overview/").then((r) => r.data),
  uptime: () => client.get<UptimeMetrics>("/metrics/uptime/").then((r) => r.data),
  responseTimes: (hours: number) =>
    client
      .get<ResponseTimesMetrics>("/metrics/response-times/", { params: { hours } })
      .then((r) => r.data),
  failures: () => client.get<FailureMetrics>("/metrics/failures/").then((r) => r.data),
};
