import { useCallback, useEffect, useState } from 'react';
import {
  ArrowLeft,
  Cpu,
  Database,
  RefreshCw,
  Server,
  Activity,
  Clock,
  AlertCircle,
  Rocket,
  Loader2,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { getAppLocale } from '../../i18n';
import { api } from '../../api/client';
import type { SystemMetrics } from '../../types/system';

interface SystemStatusViewProps {
  onBack: () => void;
}

function formatUptime(totalSeconds: number): string {
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${Math.max(1, mins)}m`;
}

function barColorForPct(pct: number, fallback: string): string {
  if (pct >= 85) return '#EF4444';
  if (pct >= 65) return '#F59E0B';
  return fallback;
}

export function SystemStatusView({ onBack }: SystemStatusViewProps) {
  const { currentTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const locale = getAppLocale(i18n.language);

  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [apiLatencyMs, setApiLatencyMs] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMetrics = useCallback(
    async (force = false) => {
      if (force) setIsRefreshing(true);
      else setIsLoading(true);
      setError(null);

      const started = performance.now();
      try {
        const data = await api.getSystemMetrics(force);
        setApiLatencyMs(Math.round(performance.now() - started));
        setMetrics(data);
      } catch (err: any) {
        setError(err.message || t('garage.system.fetchError'));
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [t]
  );

  useEffect(() => {
    loadMetrics(false);
  }, [loadMetrics]);

  const formatDateTime = (iso?: string | null) => {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    return new Intl.DateTimeFormat(locale, {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  };

  const formatShortDate = (iso?: string | null) => {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    return new Intl.DateTimeFormat(locale, {
      day: '2-digit',
      month: 'short',
    }).format(d);
  };

  const neonStorageUsed =
    metrics?.neon.configured && typeof metrics.neon.synthetic_storage_mb === 'number'
      ? metrics.neon.synthetic_storage_mb
      : metrics?.postgres.database_size_mb ?? 0;
  const neonStorageLimit = metrics?.neon.storage_limit_mb || 512;
  const neonStoragePct = Math.min(100, Math.round((neonStorageUsed / neonStorageLimit) * 100));

  const neonComputeUsed = metrics?.neon.compute_hours_used ?? 0;
  const neonComputeLimit = metrics?.neon.compute_limit_hours || 100;
  const neonComputePct = Math.min(100, Math.round((neonComputeUsed / neonComputeLimit) * 100));

  const renderMemUsed =
    metrics?.render.memory_mb ?? metrics?.runtime.process_memory_mb ?? null;
  const renderMemLimit = metrics?.render.memory_limit_mb || 512;
  const renderMemPct =
    renderMemUsed !== null
      ? Math.min(100, Math.round((renderMemUsed / renderMemLimit) * 100))
      : 0;

  return (
    <div
      style={{ paddingBottom: 'calc(2rem + env(safe-area-inset-bottom, 0px))' }}
      className="p-5 max-w-md mx-auto flex flex-col gap-5"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onBack}
            aria-label={t('common.back')}
            style={{ backgroundColor: currentTheme.bgCard, color: currentTheme.primaryText }}
            className="p-2.5 rounded-xl cursor-pointer active:scale-90 transition-transform shrink-0"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="min-w-0">
            <span
              style={{ color: currentTheme.secondaryText }}
              className="text-[10px] font-bold uppercase tracking-widest block"
            >
              {t('garage.system.subtitle')}
            </span>
            <h2
              style={{ color: currentTheme.primaryText }}
              className="text-lg font-black uppercase truncate"
            >
              {t('garage.system.title')}
            </h2>
          </div>
        </div>

        <button
          type="button"
          onClick={() => loadMetrics(true)}
          disabled={isLoading || isRefreshing}
          aria-label={t('garage.system.refresh')}
          style={{ backgroundColor: currentTheme.bgCard, color: currentTheme.primary }}
          className="px-3 py-2.5 rounded-xl text-[11px] font-black uppercase flex items-center gap-1.5 cursor-pointer active:scale-95 transition-transform disabled:opacity-50 shrink-0"
        >
          <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
          {t('garage.system.refresh')}
        </button>
      </div>

      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Loader2 className="animate-spin" size={28} style={{ color: currentTheme.primary }} />
          <span
            style={{ color: currentTheme.secondaryText }}
            className="text-xs font-bold uppercase"
          >
            {t('garage.system.loading')}
          </span>
        </div>
      ) : error ? (
        <div className="p-4 rounded-2xl bg-red-500/15 border border-red-500/40 flex items-start gap-2.5 text-red-200 text-xs font-bold">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      ) : metrics ? (
        <>
          {/* KPIs Rápidos */}
          <div className="grid grid-cols-3 gap-2.5">
            <div
              style={{ backgroundColor: currentTheme.bgCard }}
              className="p-3 rounded-2xl flex flex-col gap-1"
            >
              <span
                style={{ color: currentTheme.secondaryText }}
                className="text-[9px] font-bold uppercase flex items-center gap-1"
              >
                <Activity size={11} style={{ color: currentTheme.primary }} />
                {t('garage.system.latency')}
              </span>
              <span style={{ color: currentTheme.primaryText }} className="text-sm font-black">
                {apiLatencyMs !== null ? `${apiLatencyMs} ms` : '—'}
              </span>
            </div>

            <div
              style={{ backgroundColor: currentTheme.bgCard }}
              className="p-3 rounded-2xl flex flex-col gap-1"
            >
              <span
                style={{ color: currentTheme.secondaryText }}
                className="text-[9px] font-bold uppercase flex items-center gap-1"
              >
                <Database size={11} className="text-emerald-400" />
                {t('garage.system.dbLatency')}
              </span>
              <span style={{ color: currentTheme.primaryText }} className="text-sm font-black">
                {metrics.postgres.latency_ms} ms
              </span>
            </div>

            <div
              style={{ backgroundColor: currentTheme.bgCard }}
              className="p-3 rounded-2xl flex flex-col gap-1"
            >
              <span
                style={{ color: currentTheme.secondaryText }}
                className="text-[9px] font-bold uppercase flex items-center gap-1"
              >
                <Clock size={11} className="text-sky-400" />
                {t('garage.system.uptime')}
              </span>
              <span style={{ color: currentTheme.primaryText }} className="text-sm font-black">
                {formatUptime(metrics.runtime.uptime_seconds)}
              </span>
            </div>
          </div>

          {/* CARD 1: NEON / POSTGRES */}
          <div
            style={{ backgroundColor: currentTheme.bgCard }}
            className="p-5 rounded-3xl flex flex-col gap-4"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
                  <Database size={18} />
                </div>
                <div className="min-w-0">
                  <h3
                    style={{ color: currentTheme.primaryText }}
                    className="text-xs font-black uppercase tracking-wider truncate"
                  >
                    {t('garage.system.neonTitle')}
                  </h3>
                  <span
                    style={{ color: currentTheme.secondaryText }}
                    className="text-[10px] font-medium block truncate"
                  >
                    {metrics.neon.project_name
                      ? `${metrics.neon.project_name} • PG ${metrics.neon.pg_version || ''}`
                      : `PostgreSQL • ${metrics.postgres.database_size_mb} MB`}
                  </span>
                </div>
              </div>

              {metrics.neon.region && (
                <span
                  style={{
                    backgroundColor: currentTheme.bgDark,
                    color: currentTheme.secondaryText,
                  }}
                  className="px-2 py-1 rounded-lg text-[9px] font-bold uppercase shrink-0"
                >
                  {metrics.neon.region}
                </span>
              )}
            </div>

            {/* Barra de Armazenamento */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs">
                <span style={{ color: currentTheme.secondaryText }} className="font-bold">
                  {t('garage.system.storageLabel')}
                </span>
                <span style={{ color: currentTheme.primaryText }} className="font-black">
                  {neonStorageUsed} MB / {neonStorageLimit} MB ({neonStoragePct}%)
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
                <div
                  style={{
                    width: `${Math.max(neonStoragePct, 2)}%`,
                    backgroundColor: barColorForPct(neonStoragePct, '#10B981'),
                  }}
                  className="h-full rounded-full transition-all"
                />
              </div>
            </div>

            {metrics.neon.configured && !metrics.neon.error && (
              <>
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span style={{ color: currentTheme.secondaryText }} className="font-bold">
                      {t('garage.system.computeLabel')}
                    </span>
                    <span style={{ color: currentTheme.primaryText }} className="font-black">
                      {neonComputeUsed}h / {neonComputeLimit}h ({neonComputePct}%)
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
                    <div
                      style={{
                        width: `${Math.max(neonComputePct, 2)}%`,
                        backgroundColor: barColorForPct(neonComputePct, currentTheme.primary),
                      }}
                      className="h-full rounded-full transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <div
                    style={{ backgroundColor: currentTheme.bgDark }}
                    className="p-3 rounded-xl flex flex-col gap-0.5"
                  >
                    <span
                      style={{ color: currentTheme.secondaryText }}
                      className="text-[10px] font-bold uppercase"
                    >
                      {t('garage.system.transferLabel')}
                    </span>
                    <span style={{ color: currentTheme.primaryText }} className="text-xs font-black">
                      {metrics.neon.data_transfer_mb ?? 0} MB
                    </span>
                  </div>
                  <div
                    style={{ backgroundColor: currentTheme.bgDark }}
                    className="p-3 rounded-xl flex flex-col gap-0.5"
                  >
                    <span
                      style={{ color: currentTheme.secondaryText }}
                      className="text-[10px] font-bold uppercase"
                    >
                      {t('garage.system.connectionsLabel')}
                    </span>
                    <span style={{ color: currentTheme.primaryText }} className="text-xs font-black">
                      {metrics.postgres.active_connections}
                    </span>
                  </div>
                </div>

                {metrics.neon.quota_reset_at && (
                  <span
                    style={{ color: currentTheme.secondaryText }}
                    className="text-[10px] font-medium"
                  >
                    {t('garage.system.quotaReset', {
                      date: formatShortDate(metrics.neon.quota_reset_at),
                    })}
                  </span>
                )}
              </>
            )}

            {!metrics.neon.configured && (
              <div
                style={{
                  backgroundColor: currentTheme.bgDark,
                  color: currentTheme.secondaryText,
                }}
                className="p-3 rounded-xl text-[11px] font-medium"
              >
                {t('garage.system.neonNotConfigured')}
              </div>
            )}

            {metrics.neon.error && (
              <div className="p-3 rounded-xl bg-amber-500/15 text-amber-300 text-[11px] font-bold">
                Neon API: {metrics.neon.error}
              </div>
            )}

            {/* Contagem de Linhas por Tabela */}
            <div className="pt-3 border-t border-white/5 flex flex-col gap-2">
              <span
                style={{ color: currentTheme.secondaryText }}
                className="text-[10px] font-bold uppercase tracking-wider"
              >
                {t('garage.system.tablesTitle', { total: metrics.postgres.total_rows })}
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {Object.entries(metrics.postgres.tables).map(([tbl, count]) => (
                  <div
                    key={tbl}
                    style={{ backgroundColor: currentTheme.bgDark }}
                    className="px-3 py-2 rounded-xl flex items-center justify-between text-[11px]"
                  >
                    <span
                      style={{ color: currentTheme.secondaryText }}
                      className="font-medium truncate"
                    >
                      {tbl}
                    </span>
                    <span style={{ color: currentTheme.primaryText }} className="font-black">
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CARD 2: RENDER / API SERVER */}
          <div
            style={{ backgroundColor: currentTheme.bgCard }}
            className="p-5 rounded-3xl flex flex-col gap-4"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-sky-500/15 text-sky-400 flex items-center justify-center shrink-0">
                  <Server size={18} />
                </div>
                <div className="min-w-0">
                  <h3
                    style={{ color: currentTheme.primaryText }}
                    className="text-xs font-black uppercase tracking-wider truncate"
                  >
                    {t('garage.system.renderTitle')}
                  </h3>
                  <span
                    style={{ color: currentTheme.secondaryText }}
                    className="text-[10px] font-medium block truncate"
                  >
                    {metrics.render.service_name
                      ? `${metrics.render.service_name}${metrics.render.plan ? ` • ${metrics.render.plan}` : ''}`
                      : 'FastAPI Runtime'}
                  </span>
                </div>
              </div>

              <span
                className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase shrink-0 ${
                  metrics.render.suspended
                    ? 'bg-red-500/15 text-red-400'
                    : 'bg-emerald-500/15 text-emerald-400'
                }`}
              >
                {metrics.render.suspended
                  ? t('garage.system.statusSuspended')
                  : t('garage.system.statusLive')}
              </span>
            </div>

            {renderMemUsed !== null && (
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span style={{ color: currentTheme.secondaryText }} className="font-bold">
                    {metrics.render.memory_mb !== null && metrics.render.memory_mb !== undefined
                      ? t('garage.system.memoryLabel')
                      : t('garage.system.processRamFallback')}
                  </span>
                  <span style={{ color: currentTheme.primaryText }} className="font-black">
                    {renderMemUsed} MB / {renderMemLimit} MB ({renderMemPct}%)
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
                  <div
                    style={{
                      width: `${Math.max(renderMemPct, 2)}%`,
                      backgroundColor: barColorForPct(renderMemPct, '#38BDF8'),
                    }}
                    className="h-full rounded-full transition-all"
                  />
                </div>
              </div>
            )}

            {metrics.render.configured && !metrics.render.error && (
              <>
                <div className="grid grid-cols-2 gap-2.5">
                  <div
                    style={{ backgroundColor: currentTheme.bgDark }}
                    className="p-3 rounded-xl flex flex-col gap-0.5"
                  >
                    <span
                      style={{ color: currentTheme.secondaryText }}
                      className="text-[10px] font-bold uppercase flex items-center gap-1"
                    >
                      <Cpu size={11} />
                      {t('garage.system.cpuLabel')}
                    </span>
                    <span style={{ color: currentTheme.primaryText }} className="text-sm font-black">
                      {metrics.render.cpu_pct !== null && metrics.render.cpu_pct !== undefined
                        ? `${metrics.render.cpu_pct}%`
                        : t('garage.system.notAvailable')}
                    </span>
                  </div>

                  <div
                    style={{ backgroundColor: currentTheme.bgDark }}
                    className="p-3 rounded-xl flex flex-col gap-0.5"
                  >
                    <span
                      style={{ color: currentTheme.secondaryText }}
                      className="text-[10px] font-bold uppercase"
                    >
                      {t('garage.system.requests24h')}
                    </span>
                    <span style={{ color: currentTheme.primaryText }} className="text-sm font-black">
                      {metrics.render.requests_24h !== null &&
                      metrics.render.requests_24h !== undefined
                        ? metrics.render.requests_24h.toLocaleString(locale)
                        : t('garage.system.notAvailable')}
                    </span>
                  </div>
                </div>

                {metrics.render.latest_deploy && (
                  <div
                    style={{ backgroundColor: currentTheme.bgDark }}
                    className="p-3 rounded-xl flex flex-col gap-1"
                  >
                    <div className="flex items-center justify-between text-[10px]">
                      <span
                        style={{ color: currentTheme.secondaryText }}
                        className="font-bold uppercase flex items-center gap-1"
                      >
                        <Rocket size={11} style={{ color: currentTheme.primary }} />
                        {t('garage.system.latestDeploy')}
                      </span>
                      <span
                        style={{ color: currentTheme.secondaryText }}
                        className="font-semibold"
                      >
                        {formatDateTime(
                          metrics.render.latest_deploy.finished_at ||
                            metrics.render.latest_deploy.created_at
                        )}
                      </span>
                    </div>
                    {metrics.render.latest_deploy.commit_message && (
                      <p
                        style={{ color: currentTheme.primaryText }}
                        className="text-xs font-semibold truncate"
                      >
                        {metrics.render.latest_deploy.commit_message}
                      </p>
                    )}
                  </div>
                )}
              </>
            )}

            {!metrics.render.configured && (
              <div
                style={{
                  backgroundColor: currentTheme.bgDark,
                  color: currentTheme.secondaryText,
                }}
                className="p-3 rounded-xl text-[11px] font-medium"
              >
                {t('garage.system.renderNotConfigured')}
              </div>
            )}

            {metrics.render.error && (
              <div className="p-3 rounded-xl bg-amber-500/15 text-amber-300 text-[11px] font-bold">
                Render API: {metrics.render.error}
              </div>
            )}
          </div>

          <p
            style={{ color: currentTheme.secondaryText }}
            className="text-[10px] text-center font-medium opacity-70"
          >
            {t('garage.system.updatedAt', {
              time: new Date(metrics.fetched_at).toLocaleTimeString(locale, {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              }),
            })}
          </p>
        </>
      ) : null}
    </div>
  );
}