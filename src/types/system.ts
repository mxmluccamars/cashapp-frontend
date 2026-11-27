export interface SystemMetrics {
  fetched_at: string;
  cached: boolean;
  runtime: {
    uptime_seconds: number;
    process_memory_mb: number | null;
  };
  postgres: {
    database_size_mb: number;
    active_connections: number;
    latency_ms: number;
    tables: Record<string, number>;
    total_rows: number;
  };
  neon: {
    configured: boolean;
    error?: string | null;
    project_name?: string | null;
    region?: string | null;
    pg_version?: number | null;
    compute_hours_used?: number;
    compute_limit_hours: number;
    active_hours_used?: number;
    synthetic_storage_mb?: number;
    storage_limit_mb: number;
    data_transfer_mb?: number;
    quota_reset_at?: string | null;
  };
  render: {
    configured: boolean;
    error?: string | null;
    service_name?: string | null;
    plan?: string | null;
    region?: string | null;
    suspended?: boolean;
    cpu_pct?: number | null;
    memory_mb?: number | null;
    memory_limit_mb: number;
    requests_24h?: number | null;
    latest_deploy?: {
      status?: string | null;
      created_at?: string | null;
      finished_at?: string | null;
      commit_message?: string | null;
    } | null;
  };
}