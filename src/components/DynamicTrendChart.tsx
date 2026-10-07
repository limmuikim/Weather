import React, { useState, useMemo } from 'react';
import {
  TrendDataPoint,
  RegionName,
  PsiApiResponse,
  Pm25ApiResponse,
} from '../types/airQuality';
import {
  getPsiBandInfo,
  getPm25Category,
  REGION_CENTROIDS,
  buildRegionalTrendData,
} from '../services/airQualityService';
import { Activity, TrendingUp, Info, BarChart3, Layers } from 'lucide-react';

interface DynamicTrendChartProps {
  currentRegion: RegionName;
  psiItems: PsiApiResponse['data']['items'];
  pm25Items: Pm25ApiResponse['data']['items'];
}

type MetricType = 'psi' | 'pm25_1h' | 'pm25_24h' | 'pm10';

export const DynamicTrendChart: React.FC<DynamicTrendChartProps> = ({
  currentRegion,
  psiItems,
  pm25Items,
}) => {
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('psi');
  const [isCompareMode, setIsCompareMode] = useState<boolean>(false);
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);

  // Build trend series for active region
  const regionData = useMemo(() => {
    return buildRegionalTrendData(psiItems, pm25Items, currentRegion);
  }, [psiItems, pm25Items, currentRegion]);

  // Build multi-region series for comparison
  const allRegionsData = useMemo(() => {
    if (!isCompareMode) return null;
    const regions: RegionName[] = ['north', 'south', 'east', 'west', 'central'];
    const map: Record<RegionName, TrendDataPoint[]> = {} as any;
    for (const r of regions) {
      map[r] = buildRegionalTrendData(psiItems, pm25Items, r);
    }
    return map;
  }, [isCompareMode, psiItems, pm25Items]);

  const metricConfig = {
    psi: {
      title: '24-Hour PSI Trend',
      unit: '',
      getValue: (d: TrendDataPoint) => d.psi,
      color: '#06b6d4', // cyan-500
      gradientId: 'psiGradient',
      thresholds: [
        { val: 50, label: 'Good (50)', color: '#10b981' },
        { val: 100, label: 'Moderate (100)', color: '#0ea5e9' },
        { val: 200, label: 'Unhealthy (200)', color: '#f59e0b' },
      ],
      desc: 'Singapore Standard Pollutant Standards Index over past 24 hours',
    },
    pm25_1h: {
      title: '1-Hour PM2.5 Concentration',
      unit: 'µg/m³',
      getValue: (d: TrendDataPoint) => d.pm25OneHour,
      color: '#f59e0b', // amber-500
      gradientId: 'pm25_1h_Gradient',
      thresholds: [
        { val: 55, label: 'Normal (55)', color: '#10b981' },
        { val: 150, label: 'Elevated (150)', color: '#f59e0b' },
        { val: 250, label: 'High (250)', color: '#ef4444' },
      ],
      desc: 'Real-time 1-hour PM2.5 hourly moving reading for immediate outdoor decisions',
    },
    pm25_24h: {
      title: '24-Hour PM2.5 Mean',
      unit: 'µg/m³',
      getValue: (d: TrendDataPoint) => d.pm25TwentyFourHour,
      color: '#3b82f6', // blue-500
      gradientId: 'pm25_24h_Gradient',
      thresholds: [
        { val: 55, label: 'Normal (55)', color: '#10b981' },
        { val: 150, label: 'Elevated (150)', color: '#f59e0b' },
      ],
      desc: '24-hour moving average PM2.5 concentration',
    },
    pm10: {
      title: '24-Hour PM10 Particulate',
      unit: 'µg/m³',
      getValue: (d: TrendDataPoint) => d.pm10,
      color: '#8b5cf6', // purple-500
      gradientId: 'pm10Gradient',
      thresholds: [
        { val: 50, label: 'Good (50)', color: '#10b981' },
        { val: 100, label: 'Moderate (100)', color: '#0ea5e9' },
      ],
      desc: 'Coarse particulate matter with diameter up to 10 micrometers',
    },
  };

  const currentCfg = metricConfig[selectedMetric];

  // Calculate chart boundaries
  const values = regionData.map(currentCfg.getValue);
  const minVal = values.length ? Math.min(...values) : 0;
  const maxVal = values.length ? Math.max(...values) : 100;
  const avgVal = values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0;

  // Chart coordinate space
  const chartWidth = 720;
  const chartHeight = 260;
  const padLeft = 46;
  const padRight = 24;
  const padTop = 30;
  const padBottom = 42;
  const plotWidth = chartWidth - padLeft - padRight;
  const plotHeight = chartHeight - padTop - padBottom;

  const yMax = Math.max(maxVal * 1.2, selectedMetric === 'psi' ? 120 : 80);
  const yMin = 0;

  const getX = (index: number) => {
    if (regionData.length <= 1) return padLeft + plotWidth / 2;
    return padLeft + (index / (regionData.length - 1)) * plotWidth;
  };

  const getY = (val: number) => {
    const clamped = Math.max(yMin, Math.min(yMax, val));
    return padTop + plotHeight - ((clamped - yMin) / (yMax - yMin)) * plotHeight;
  };

  // Build SVG smooth path using Catmull-Rom or cubic Bezier
  const buildSmoothPath = (points: { x: number; y: number }[]): string => {
    if (points.length === 0) return '';
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
    if (points.length === 2) return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;

    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i === 0 ? 0 : i - 1];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2 < points.length ? i + 2 : i + 1];

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      path += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }
    return path;
  };

  const primaryPoints = regionData.map((d, i) => ({
    x: getX(i),
    y: getY(currentCfg.getValue(d)),
    item: d,
  }));

  const primaryLinePath = buildSmoothPath(primaryPoints);
  const primaryAreaPath =
    primaryPoints.length > 0
      ? `${primaryLinePath} L ${primaryPoints[primaryPoints.length - 1].x} ${padTop + plotHeight} L ${primaryPoints[0].x} ${padTop + plotHeight} Z`
      : '';

  // Multi-region comparison lines styling
  const regionColors: Record<RegionName, string> = {
    north: '#38bdf8', // sky-400
    south: '#f43f5e', // rose-500
    east: '#10b981', // emerald-500
    west: '#f59e0b', // amber-500
    central: '#a855f7', // purple-500
  };

  const hoveredData = hoveredPointIndex !== null ? regionData[hoveredPointIndex] : null;

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800/80 p-5 md:p-6 backdrop-blur-md shadow-xl text-slate-100">
      {/* Header with Title and Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-teal-400" />
            <h2 className="text-base md:text-lg font-bold text-white tracking-tight">
              Dynamic Regional Trend Chart
            </h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-teal-300 border border-slate-700">
              {REGION_CENTROIDS[currentRegion].label} Region
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">{currentCfg.desc}</p>
        </div>

        {/* Metric Switcher Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(
            [
              { id: 'psi', label: '24h PSI' },
              { id: 'pm25_1h', label: '1h PM2.5' },
              { id: 'pm25_24h', label: '24h PM2.5' },
              { id: 'pm10', label: 'PM10' },
            ] as const
          ).map((m) => (
            <button
              key={m.id}
              onClick={() => setSelectedMetric(m.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
                selectedMetric === m.id
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-xs'
                  : 'bg-slate-800/60 text-slate-400 border border-slate-750 hover:text-slate-200'
              }`}
            >
              {m.label}
            </button>
          ))}

          {/* Compare toggle */}
          <button
            onClick={() => setIsCompareMode(!isCompareMode)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ml-1 border ${
              isCompareMode
                ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                : 'bg-slate-800/40 text-slate-400 border-slate-750 hover:text-slate-200'
            }`}
            title="Overlay all 5 Singapore regions to compare air quality"
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Compare Regions</span>
            <span className="sm:hidden">Compare</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Pills */}
      <div className="grid grid-cols-3 gap-3 py-3 border-b border-slate-800/60 text-xs">
        <div className="bg-slate-800/40 rounded-xl p-2.5 border border-slate-800">
          <div className="text-slate-400 text-[11px]">Latest Reading</div>
          <div className="text-base font-bold text-teal-300">
            {values.length ? values[values.length - 1] : '--'}{' '}
            <span className="text-[11px] font-normal text-slate-400">{currentCfg.unit}</span>
          </div>
        </div>
        <div className="bg-slate-800/40 rounded-xl p-2.5 border border-slate-800">
          <div className="text-slate-400 text-[11px]">24-Hour Range</div>
          <div className="text-base font-bold text-slate-200">
            {minVal} – {maxVal}{' '}
            <span className="text-[11px] font-normal text-slate-400">{currentCfg.unit}</span>
          </div>
        </div>
        <div className="bg-slate-800/40 rounded-xl p-2.5 border border-slate-800">
          <div className="text-slate-400 text-[11px]">Average</div>
          <div className="text-base font-bold text-slate-200">
            {avgVal}{' '}
            <span className="text-[11px] font-normal text-slate-400">{currentCfg.unit}</span>
          </div>
        </div>
      </div>

      {/* Compare Mode Legend */}
      {isCompareMode && (
        <div className="flex flex-wrap items-center gap-3 pt-3 text-xs">
          <span className="text-slate-400 text-[11px]">Regions:</span>
          {(['north', 'south', 'east', 'west', 'central'] as RegionName[]).map((r) => (
            <div
              key={r}
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[11px] ${
                r === currentRegion
                  ? 'bg-slate-800 border-teal-500/50 text-white font-semibold'
                  : 'bg-slate-900 border-slate-800 text-slate-400'
              }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: regionColors[r] }}
              />
              <span className="capitalize">{r}</span>
              {r === currentRegion && <span className="text-[10px] text-teal-400">(Selected)</span>}
            </div>
          ))}
        </div>
      )}

      {/* SVG Chart Container */}
      <div className="relative mt-2 w-full select-none">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-auto overflow-visible"
        >
          <defs>
            <linearGradient id={currentCfg.gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={currentCfg.color} stopOpacity="0.35" />
              <stop offset="85%" stopColor={currentCfg.color} stopOpacity="0.02" />
              <stop offset="100%" stopColor={currentCfg.color} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines & Y-axis labels */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const val = Math.round(yMin + ratio * (yMax - yMin));
            const y = getY(val);
            return (
              <g key={ratio}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={chartWidth - padRight}
                  y2={y}
                  stroke="#334155"
                  strokeDasharray="3 3"
                  strokeWidth="0.8"
                />
                <text
                  x={padLeft - 8}
                  y={y + 3.5}
                  fill="#94a3b8"
                  fontSize="10"
                  textAnchor="end"
                  fontFamily="monospace"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* Standard NEA Reference Threshold lines */}
          {currentCfg.thresholds.map((th) => {
            if (th.val > yMax) return null;
            const y = getY(th.val);
            return (
              <g key={th.val}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={chartWidth - padRight}
                  y2={y}
                  stroke={th.color}
                  strokeWidth="1"
                  strokeDasharray="4 4"
                  opacity="0.6"
                />
                <text
                  x={chartWidth - padRight + 4}
                  y={y + 3}
                  fill={th.color}
                  fontSize="9"
                  fontFamily="sans-serif"
                  fontWeight="bold"
                >
                  {th.label}
                </text>
              </g>
            );
          })}

          {/* Multi-region comparison background lines */}
          {isCompareMode &&
            allRegionsData &&
            Object.entries(allRegionsData).map(([rKey, rPoints]) => {
              if (rKey === currentRegion) return null;
              const pts = rPoints.map((d, i) => ({
                x: getX(i),
                y: getY(currentCfg.getValue(d)),
              }));
              const pathStr = buildSmoothPath(pts);
              return (
                <path
                  key={rKey}
                  d={pathStr}
                  fill="none"
                  stroke={regionColors[rKey as RegionName]}
                  strokeWidth="1.6"
                  opacity="0.5"
                  strokeLinecap="round"
                />
              );
            })}

          {/* Primary Area Fill */}
          {primaryAreaPath && (
            <path
              d={primaryAreaPath}
              fill={`url(#${currentCfg.gradientId})`}
              className="transition-all duration-300"
            />
          )}

          {/* Primary Trend Line */}
          {primaryLinePath && (
            <path
              d={primaryLinePath}
              fill="none"
              stroke={currentCfg.color}
              strokeWidth="2.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-all duration-300"
            />
          )}

          {/* Data Points on Primary Line */}
          {primaryPoints.map((pt, i) => {
            const isHovered = hoveredPointIndex === i;
            return (
              <g key={i}>
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? 6 : 3.5}
                  fill={isHovered ? '#ffffff' : currentCfg.color}
                  stroke="#0f172a"
                  strokeWidth="2"
                  className="cursor-pointer transition-all duration-150"
                  onMouseEnter={() => setHoveredPointIndex(i)}
                />
              </g>
            );
          })}

          {/* X-Axis labels (timestamps) */}
          {regionData.map((d, i) => {
            // Show every 2nd or 3rd label depending on density
            const step = Math.max(1, Math.floor(regionData.length / 7));
            if (i % step !== 0 && i !== regionData.length - 1) return null;
            const x = getX(i);
            return (
              <text
                key={i}
                x={x}
                y={chartHeight - 12}
                fill="#94a3b8"
                fontSize="10"
                textAnchor="middle"
                fontFamily="monospace"
              >
                {d.timeLabel}
              </text>
            );
          })}

          {/* Interactive Crosshair & Hover Tooltip */}
          {hoveredPointIndex !== null && hoveredData && (
            <g>
              <line
                x1={getX(hoveredPointIndex)}
                y1={padTop}
                x2={getX(hoveredPointIndex)}
                y2={padTop + plotHeight}
                stroke="#94a3b8"
                strokeWidth="1"
                strokeDasharray="2 2"
              />
            </g>
          )}

          {/* Transparent Hover Hit Boxes */}
          {regionData.map((_, i) => {
            const x = getX(i);
            const w = plotWidth / Math.max(1, regionData.length);
            return (
              <rect
                key={i}
                x={x - w / 2}
                y={padTop}
                width={w}
                height={plotHeight}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => setHoveredPointIndex(i)}
                onMouseLeave={() => setHoveredPointIndex(null)}
              />
            );
          })}
        </svg>

        {/* Hover Floating Card */}
        {hoveredPointIndex !== null && hoveredData && (
          <div
            className="absolute z-20 pointer-events-none rounded-xl bg-slate-950/95 border border-slate-700 shadow-2xl p-3 text-xs backdrop-blur-md transition-all -translate-x-1/2 -translate-y-full mb-3"
            style={{
              left: `${(getX(hoveredPointIndex) / chartWidth) * 100}%`,
              top: `${(getY(currentCfg.getValue(hoveredData)) / chartHeight) * 100}%`,
            }}
          >
            <div className="flex items-center justify-between gap-3 text-slate-400 border-b border-slate-800 pb-1 mb-1.5 font-mono text-[11px]">
              <span>{hoveredData.timeLabel}</span>
              <span className="capitalize text-teal-400">{currentRegion}</span>
            </div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-slate-300 font-medium">{currentCfg.title}:</span>
              <span className="text-sm font-bold text-white">
                {currentCfg.getValue(hoveredData)} {currentCfg.unit}
              </span>
            </div>
            {selectedMetric === 'psi' && (
              <div className="flex items-center gap-1.5 pt-1 text-[11px]">
                <span
                  className={`px-1.5 py-0.5 rounded font-semibold ${
                    getPsiBandInfo(hoveredData.psi).bgLight
                  } ${getPsiBandInfo(hoveredData.psi).textColor}`}
                >
                  {getPsiBandInfo(hoveredData.psi).label}
                </span>
                <span className="text-slate-400">
                  {getPsiBandInfo(hoveredData.psi).healthAdvice.general.slice(0, 36)}...
                </span>
              </div>
            )}
            {selectedMetric.startsWith('pm25') && (
              <div className="flex items-center gap-1.5 pt-1 text-[11px]">
                <span
                  className={`px-1.5 py-0.5 rounded font-semibold ${
                    getPm25Category(hoveredData.pm25OneHour).badgeClass
                  }`}
                >
                  {getPm25Category(hoveredData.pm25OneHour).label}
                </span>
                <span className="text-slate-400">PM2.5 (1h): {hoveredData.pm25OneHour} µg/m³</span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
        <span className="flex items-center gap-1">
          <Info className="w-3.5 h-3.5 text-slate-400" />
          <span>Hover or tap any node to inspect hourly air quality records.</span>
        </span>
        <span className="hidden sm:inline font-mono text-[11px] text-slate-400">
          Source: NEA real-time data API
        </span>
      </div>
    </div>
  );
};
