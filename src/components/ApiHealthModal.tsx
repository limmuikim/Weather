import React, { useState } from 'react';
import { SystemHealthResponse } from '../types/airQuality';
import {
  Server,
  CheckCircle,
  AlertTriangle,
  XCircle,
  RefreshCw,
  ExternalLink,
  Code,
  X,
  Clock,
  Zap,
} from 'lucide-react';

interface ApiHealthModalProps {
  isOpen: boolean;
  onClose: () => void;
  healthData: SystemHealthResponse | null;
  isLoading: boolean;
  onRefresh: () => void;
}

export const ApiHealthModal: React.FC<ApiHealthModalProps> = ({
  isOpen,
  onClose,
  healthData,
  isLoading,
  onRefresh,
}) => {
  const [showJson, setShowJson] = useState(false);

  if (!isOpen) return null;

  const isHealthy = healthData?.status === 'healthy';
  const isDegraded = healthData?.status === 'degraded';

  const psiService = healthData?.services?.nea_psi;
  const pm25Service = healthData?.services?.nea_pm25;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl bg-slate-900 border border-slate-750 rounded-2xl shadow-2xl p-6 text-slate-100 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl border ${
                isHealthy
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : isDegraded
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                  : 'bg-red-500/10 border-red-500/30 text-red-400'
              }`}
            >
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                External API Service Availability
              </h2>
              <p className="text-xs text-slate-400">
                Monitored via endpoint <code className="text-teal-300">/api/health.js</code>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Status Banner */}
        <div
          className={`my-4 p-4 rounded-xl border flex items-center justify-between ${
            isHealthy
              ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-200'
              : isDegraded
              ? 'bg-amber-950/40 border-amber-500/30 text-amber-200'
              : 'bg-red-950/40 border-red-500/30 text-red-200'
          }`}
        >
          <div className="flex items-center gap-3">
            {isHealthy ? (
              <CheckCircle className="w-6 h-6 text-emerald-400 shrink-0" />
            ) : isDegraded ? (
              <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0" />
            ) : (
              <XCircle className="w-6 h-6 text-red-400 shrink-0" />
            )}
            <div>
              <div className="text-sm font-bold uppercase tracking-wide">
                System Status: {healthData?.status || 'Unknown'}
              </div>
              <div className="text-xs text-slate-300 mt-0.5">
                {isHealthy
                  ? 'All upstream NEA real-time data feeds are operational.'
                  : 'One or more NEA data feeds experiencing intermittent latency.'}
              </div>
            </div>
          </div>

          <div className="text-right text-xs">
            <span className="text-slate-400 block font-mono text-[11px]">
              Last Checked:
            </span>
            <span className="font-mono text-slate-200">
              {healthData?.timestamp
                ? new Date(healthData.timestamp).toLocaleTimeString()
                : '--'}
            </span>
          </div>
        </div>

        {/* Service Feeds Grid */}
        <div className="space-y-3.5 my-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Monitored Data Endpoints
          </h3>

          {/* PSI API Feed */}
          <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-750">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white">NEA PSI Feed (Real-Time)</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                      psiService?.healthy
                        ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                        : 'bg-red-500/10 text-red-300 border-red-500/30'
                    }`}
                  >
                    {psiService?.status?.toUpperCase() || 'OFFLINE'}
                  </span>
                </div>
                <div className="font-mono text-xs text-teal-400 mt-1 break-all">
                  {psiService?.url || 'https://api-open.data.gov.sg/v2/real-time/api/psi'}
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 block">HTTP Code</span>
                <span className="font-mono text-sm font-bold text-white">
                  {psiService?.statusCode || '--'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-700/60 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px] flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-400" /> Ping Latency:
                </span>
                <span className="font-mono font-semibold text-slate-200">
                  {psiService?.latencyMs ?? '--'} ms
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px] flex items-center gap-1">
                  <Clock className="w-3 h-3 text-sky-400" /> NEA Timestamp:
                </span>
                <span className="font-mono text-slate-200 text-[11px]">
                  {psiService?.updatedTimestamp?.slice(11, 19) || 'Active'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Regions Checked:</span>
                <span className="text-slate-200 font-mono text-[11px]">
                  {psiService?.regionsFound?.join(', ') || '5/5 regions'}
                </span>
              </div>
            </div>
          </div>

          {/* PM2.5 API Feed */}
          <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-750">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white">NEA PM2.5 Feed (Real-Time)</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                      pm25Service?.healthy
                        ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                        : 'bg-red-500/10 text-red-300 border-red-500/30'
                    }`}
                  >
                    {pm25Service?.status?.toUpperCase() || 'OFFLINE'}
                  </span>
                </div>
                <div className="font-mono text-xs text-teal-400 mt-1 break-all">
                  {pm25Service?.url || 'https://api-open.data.gov.sg/v2/real-time/api/pm25'}
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 block">HTTP Code</span>
                <span className="font-mono text-sm font-bold text-white">
                  {pm25Service?.statusCode || '--'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-700/60 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px] flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-400" /> Ping Latency:
                </span>
                <span className="font-mono font-semibold text-slate-200">
                  {pm25Service?.latencyMs ?? '--'} ms
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px] flex items-center gap-1">
                  <Clock className="w-3 h-3 text-sky-400" /> NEA Timestamp:
                </span>
                <span className="font-mono text-slate-200 text-[11px]">
                  {pm25Service?.updatedTimestamp?.slice(11, 19) || 'Active'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Regions Checked:</span>
                <span className="text-slate-200 font-mono text-[11px]">
                  {pm25Service?.regionsFound?.join(', ') || '5/5 regions'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Raw JSON toggle */}
        {showJson && (
          <div className="my-4">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Raw Response from <code className="text-teal-400">/api/health.js</code>:</span>
            </div>
            <pre className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] font-mono text-teal-300 overflow-x-auto max-h-48">
              {JSON.stringify(healthData, null, 2)}
            </pre>
          </div>
        )}

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-500/20 text-teal-300 hover:bg-teal-500/30 border border-teal-500/40 font-medium transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'Pinging Feeds...' : 'Ping APIs Now'}</span>
            </button>
            <button
              onClick={() => setShowJson(!showJson)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
            >
              <Code className="w-3.5 h-3.5" />
              <span>{showJson ? 'Hide JSON' : 'Inspect JSON'}</span>
            </button>
          </div>

          <a
            href="/api/health.js"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-slate-400 hover:text-slate-200 underline underline-offset-2"
          >
            <span>Open /api/health.js in browser</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
