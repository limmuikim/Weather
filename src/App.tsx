import React, { useState, useEffect, useCallback } from 'react';
import {
  RegionName,
  PsiApiResponse,
  Pm25ApiResponse,
  SystemHealthResponse,
} from './types/airQuality';
import {
  fetchPsiData,
  fetchPm25Data,
  fetchSystemHealth,
  findNearestRegion,
  getPsiBandInfo,
  getPm25Category,
  REGION_CENTROIDS,
} from './services/airQualityService';
import { WeatherEffectOverlay } from './components/WeatherEffectOverlay';
import { WeatherEffectControls } from './components/WeatherEffectControls';
import { DynamicTrendChart } from './components/DynamicTrendChart';
import { SingaporeMapRadar } from './components/SingaporeMapRadar';
import { HealthAdvisoryCard } from './components/HealthAdvisoryCard';
import { PollutantBreakdown } from './components/PollutantBreakdown';
import { RegionSelector } from './components/RegionSelector';
import { ApiHealthModal } from './components/ApiHealthModal';
import {
  Wind,
  Activity,
  RefreshCw,
  Server,
  ShieldCheck,
  AlertCircle,
  Clock,
  Compass,
  CheckCircle,
  Eye,
  SlidersHorizontal,
} from 'lucide-react';

export default function App() {
  // State for data
  const [selectedRegion, setSelectedRegion] = useState<RegionName>('central');
  const [psiData, setPsiData] = useState<PsiApiResponse | null>(null);
  const [pm25Data, setPm25Data] = useState<Pm25ApiResponse | null>(null);
  const [healthData, setHealthData] = useState<SystemHealthResponse | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  // Geolocation state
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
    region: RegionName;
    distanceKm: number;
  } | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Weather effect controls & simulation state
  const [isWeatherEffectEnabled, setIsWeatherEffectEnabled] = useState<boolean>(true);
  const [simulatedPsi, setSimulatedPsi] = useState<number | null>(null);
  const [effectIntensity, setEffectIntensity] = useState<number>(1.0);
  const [windSpeed, setWindSpeed] = useState<number>(2);

  // Modals
  const [isHealthModalOpen, setIsHealthModalOpen] = useState<boolean>(false);
  const [isHealthLoading, setIsHealthLoading] = useState<boolean>(false);

  // Load air quality data and health status
  const loadData = useCallback(async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    setError(null);

    try {
      // Get today's ISO date string YYYY-MM-DD
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];

      // Fetch today's full timeline for dynamic trend charts
      const [psiRes, pm25Res, healthRes] = await Promise.allSettled([
        fetchPsiData(dateStr),
        fetchPm25Data(dateStr),
        fetchSystemHealth(),
      ]);

      if (psiRes.status === 'fulfilled') {
        setPsiData(psiRes.value);
      } else {
        console.error('PSI fetch failed:', psiRes.reason);
      }

      if (pm25Res.status === 'fulfilled') {
        setPm25Data(pm25Res.value);
      } else {
        console.error('PM2.5 fetch failed:', pm25Res.reason);
      }

      if (healthRes.status === 'fulfilled') {
        setHealthData(healthRes.value);
      }

      if (psiRes.status === 'rejected' && pm25Res.status === 'rejected') {
        setError('Unable to reach NEA air quality services. Please check connection.');
      } else {
        setLastRefreshed(new Date());
      }
    } catch (err: any) {
      setError(err?.message || 'Error fetching air quality data');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Initial load and periodic refresh every 5 minutes
  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      loadData();
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Handle GPS detection
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const nearest = findNearestRegion(latitude, longitude);
        setUserLocation({
          lat: latitude,
          lng: longitude,
          region: nearest.region,
          distanceKm: nearest.distanceKm,
        });
        setSelectedRegion(nearest.region);
        setIsLocating(false);
      },
      (err) => {
        setIsLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setLocationError('Location permission was denied. You can manually select a region below.');
        } else {
          setLocationError('Unable to retrieve location. Please select a region manually.');
        }
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Ping health endpoint manually
  const handleRefreshHealth = async () => {
    setIsHealthLoading(true);
    try {
      const res = await fetchSystemHealth();
      setHealthData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsHealthLoading(false);
    }
  };

  // Derive latest readings
  const psiItems = psiData?.data?.items || [];
  const pm25Items = pm25Data?.data?.items || [];
  const latestPsiItem = psiItems[psiItems.length - 1];
  const latestPm25Item = pm25Items[pm25Items.length - 1];

  const psiReadingsMap: Record<RegionName, number> = {
    north: latestPsiItem?.readings?.psi_twenty_four_hourly?.north ?? 0,
    south: latestPsiItem?.readings?.psi_twenty_four_hourly?.south ?? 0,
    east: latestPsiItem?.readings?.psi_twenty_four_hourly?.east ?? 0,
    west: latestPsiItem?.readings?.psi_twenty_four_hourly?.west ?? 0,
    central: latestPsiItem?.readings?.psi_twenty_four_hourly?.central ?? 0,
  };

  const pm25ReadingsMap: Record<RegionName, number> = {
    north: latestPm25Item?.readings?.pm25_one_hourly?.north ?? 0,
    south: latestPm25Item?.readings?.pm25_one_hourly?.south ?? 0,
    east: latestPm25Item?.readings?.pm25_one_hourly?.east ?? 0,
    west: latestPm25Item?.readings?.pm25_one_hourly?.west ?? 0,
    central: latestPm25Item?.readings?.pm25_one_hourly?.central ?? 0,
  };

  const currentRealPsi = psiReadingsMap[selectedRegion] || 0;
  const currentRealPm25_1h = pm25ReadingsMap[selectedRegion] || 0;
  const currentPm25_24h = latestPsiItem?.readings?.pm25_twenty_four_hourly?.[selectedRegion] ?? 0;
  const currentPm10_24h = latestPsiItem?.readings?.pm10_twenty_four_hourly?.[selectedRegion] ?? 0;

  // Active PSI for weather effect overlay (can be simulated or live)
  const activeEffectPsi = simulatedPsi !== null ? simulatedPsi : currentRealPsi;
  const activeBandInfo = getPsiBandInfo(activeEffectPsi);
  const realBandInfo = getPsiBandInfo(currentRealPsi);
  const pm25Cat = getPm25Category(currentRealPm25_1h);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 relative font-sans selection:bg-teal-500/25 selection:text-teal-200">
      {/* Animated Weather Effect (Smog / Fog / Atmospheric Tint) */}
      <WeatherEffectOverlay
        psi={activeEffectPsi}
        band={activeBandInfo.band}
        isEnabled={isWeatherEffectEnabled}
        intensityScale={effectIntensity}
        windSpeed={windSpeed}
      />

      {/* Main Container */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6">
        {/* Top Navigation Bar */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-sky-600 flex items-center justify-center shadow-lg shadow-teal-500/20 shrink-0">
              <Wind className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-white">
                  SG Air Quality & Haze Monitor
                </h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-teal-300 border border-slate-700">
                  NEA LIVE
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Real-time 24h PSI & 1h PM2.5 tracking across Singapore
              </p>
            </div>
          </div>

          {/* Right Header Utilities */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Weather Overlay Controls */}
            <WeatherEffectControls
              realPsi={currentRealPsi}
              activePsi={activeEffectPsi}
              isSimulating={simulatedPsi !== null}
              onSimulatePsiChange={setSimulatedPsi}
              isEnabled={isWeatherEffectEnabled}
              onToggleEnabled={() => setIsWeatherEffectEnabled(!isWeatherEffectEnabled)}
              intensityScale={effectIntensity}
              onChangeIntensity={setEffectIntensity}
              windSpeed={windSpeed}
              onChangeWindSpeed={setWindSpeed}
            />

            {/* Health Endpoint Status Pill */}
            <button
              onClick={() => setIsHealthModalOpen(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border backdrop-blur-md transition-all ${
                healthData?.status === 'healthy'
                  ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30 hover:bg-emerald-900/50'
                  : healthData?.status === 'degraded'
                  ? 'bg-amber-950/40 text-amber-300 border-amber-500/30 hover:bg-amber-900/50'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
              }`}
              title="Inspect external NEA API service availability (/api/health.js)"
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  healthData?.status === 'healthy'
                    ? 'bg-emerald-400 animate-pulse'
                    : 'bg-amber-400'
                }`}
              />
              <Server className="w-3.5 h-3.5" />
              <span className="hidden md:inline">API Status:</span>
              <span className="capitalize">{healthData?.status || 'Online'}</span>
            </button>

            {/* Manual Refresh Button */}
            <button
              onClick={() => loadData(true)}
              disabled={isRefreshing}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 transition-colors"
              title="Refresh NEA data"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-teal-400' : ''}`} />
            </button>
          </div>
        </header>

        {/* Global Error Banner if API failed */}
        {error && (
          <div className="p-4 rounded-2xl bg-amber-950/50 border border-amber-500/40 text-amber-200 text-xs flex items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => loadData(true)}
              className="px-3 py-1 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40 font-medium"
            >
              Retry
            </button>
          </div>
        )}

        {/* Active Simulation Notice */}
        {simulatedPsi !== null && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-amber-400" />
              <span>
                <b>Haze Simulation Mode Active:</b> Visual smog and fog effects are currently rendering at simulated PSI <b>{simulatedPsi}</b> ({activeBandInfo.label}). Real-time reading is {currentRealPsi}.
              </span>
            </div>
            <button
              onClick={() => setSimulatedPsi(null)}
              className="px-2.5 py-1 rounded-md bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 font-semibold"
            >
              Reset to Live
            </button>
          </div>
        )}

        {/* Hero Section: Key Readings for Selected Region */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Main Air Quality Gauge Card (8 cols) */}
          <div className="lg:col-span-8 bg-slate-900/90 rounded-2xl border border-slate-800 p-6 backdrop-blur-xl shadow-xl flex flex-col justify-between relative overflow-hidden">
            {/* Ambient background glow according to air quality */}
            <div
              className="absolute -top-24 -right-24 w-80 h-80 rounded-full blur-3xl opacity-20 pointer-events-none transition-all duration-700"
              style={{ backgroundColor: realBandInfo.colorHex }}
            />

            <div>
              {/* Region Info & Updated Time */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <Compass className="w-5 h-5 text-teal-400" />
                  <div>
                    <h2 className="text-xl font-extrabold text-white capitalize tracking-tight">
                      {REGION_CENTROIDS[selectedRegion].label} Region
                    </h2>
                    <p className="text-xs text-slate-400">
                      Covers {REGION_CENTROIDS[selectedRegion].neighborhoods}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    Updated:{' '}
                    {latestPsiItem?.updatedTimestamp
                      ? new Date(latestPsiItem.updatedTimestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'Live'}
                  </span>
                </div>
              </div>

              {/* Big KPI Metrics Split */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6 items-center">
                {/* 24-hr PSI Primary Badge */}
                <div className="flex items-center gap-5 p-4 rounded-2xl bg-slate-800/40 border border-slate-750">
                  <div className="relative flex items-center justify-center shrink-0">
                    <svg className="w-28 h-28 transform -rotate-90">
                      <circle
                        cx="56"
                        cy="56"
                        r="44"
                        stroke="#1e293b"
                        strokeWidth="8"
                        fill="transparent"
                      />
                      <circle
                        cx="56"
                        cy="56"
                        r="44"
                        stroke={realBandInfo.colorHex}
                        strokeWidth="8"
                        strokeDasharray={2 * Math.PI * 44}
                        strokeDashoffset={
                          2 * Math.PI * 44 * (1 - Math.min(1, currentRealPsi / 300))
                        }
                        strokeLinecap="round"
                        fill="transparent"
                        className="transition-all duration-1000 ease-out"
                      />
                    </svg>
                    <div className="absolute text-center">
                      <span className="text-3xl font-black font-mono text-white block leading-none">
                        {currentRealPsi}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">24h PSI</span>
                    </div>
                  </div>

                  <div>
                    <span
                      className={`text-xs uppercase font-bold tracking-wider px-2 py-0.5 rounded-md border ${realBandInfo.bgLight} ${realBandInfo.textColor} ${realBandInfo.borderColor}`}
                    >
                      {realBandInfo.label}
                    </span>
                    <h3 className="text-sm font-semibold text-white mt-1.5">
                      Air Quality Descriptor
                    </h3>
                    <p className="text-xs text-slate-300 mt-1 leading-snug">
                      {realBandInfo.description}
                    </p>
                  </div>
                </div>

                {/* 1-Hour PM2.5 Primary Reading */}
                <div className="flex items-center gap-5 p-4 rounded-2xl bg-slate-800/40 border border-slate-750">
                  <div className="relative flex items-center justify-center shrink-0">
                    <svg className="w-28 h-28 transform -rotate-90">
                      <circle
                        cx="56"
                        cy="56"
                        r="44"
                        stroke="#1e293b"
                        strokeWidth="8"
                        fill="transparent"
                      />
                      <circle
                        cx="56"
                        cy="56"
                        r="44"
                        stroke={pm25Cat.color}
                        strokeWidth="8"
                        strokeDasharray={2 * Math.PI * 44}
                        strokeDashoffset={
                          2 * Math.PI * 44 * (1 - Math.min(1, currentRealPm25_1h / 150))
                        }
                        strokeLinecap="round"
                        fill="transparent"
                        className="transition-all duration-1000 ease-out"
                      />
                    </svg>
                    <div className="absolute text-center">
                      <span className="text-3xl font-black font-mono text-white block leading-none">
                        {currentRealPm25_1h}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">µg/m³</span>
                    </div>
                  </div>

                  <div>
                    <span
                      className={`text-xs uppercase font-bold tracking-wider px-2 py-0.5 rounded-md border ${pm25Cat.badgeClass}`}
                    >
                      {pm25Cat.label}
                    </span>
                    <h3 className="text-sm font-semibold text-white mt-1.5">
                      1-Hour PM2.5 Reading
                    </h3>
                    <p className="text-xs text-slate-300 mt-1 leading-snug">
                      {currentRealPm25_1h <= 55
                        ? 'Good for immediate outdoor physical exercise and runs.'
                        : 'Elevated particle concentrations. Consider limiting intense cardio outdoors.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Sub-Metric Summary Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-800 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-800/30 border border-slate-800">
                <div className="text-slate-400 text-[11px]">PM2.5 (24-Hour)</div>
                <div className="text-lg font-bold font-mono text-teal-300 mt-0.5">
                  {currentPm25_24h}{' '}
                  <span className="text-[10px] text-slate-400 font-sans">µg/m³</span>
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-800/30 border border-slate-800">
                <div className="text-slate-400 text-[11px]">PM10 (24-Hour)</div>
                <div className="text-lg font-bold font-mono text-slate-200 mt-0.5">
                  {currentPm10_24h}{' '}
                  <span className="text-[10px] text-slate-400 font-sans">µg/m³</span>
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-800/30 border border-slate-800">
                <div className="text-slate-400 text-[11px]">Atmosphere</div>
                <div className="text-sm font-bold text-slate-200 mt-1 truncate">
                  {currentRealPsi <= 50 ? 'Clear Sky' : currentRealPsi <= 100 ? 'Mild Mist' : 'Smog Drift'}
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-800/30 border border-slate-800">
                <div className="text-slate-400 text-[11px]">Weather Overlay</div>
                <div className="text-sm font-bold text-teal-300 mt-1 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                  {isWeatherEffectEnabled ? 'Active' : 'Off'}
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Singapore Map & Radar (4 cols) */}
          <div className="lg:col-span-4 flex">
            <SingaporeMapRadar
              selectedRegion={selectedRegion}
              onSelectRegion={setSelectedRegion}
              psiReadings={psiReadingsMap}
              pm25Readings={pm25ReadingsMap}
              userLocation={userLocation}
            />
          </div>
        </section>

        {/* Region & Location Selector */}
        <section>
          <RegionSelector
            currentRegion={selectedRegion}
            onSelectRegion={setSelectedRegion}
            psiMap={psiReadingsMap}
            pm25Map={pm25ReadingsMap}
            userLocation={userLocation}
            isLocating={isLocating}
            onDetectLocation={handleDetectLocation}
            locationError={locationError}
          />
        </section>

        {/* Dynamic Regional Trend Chart */}
        <section>
          <DynamicTrendChart
            currentRegion={selectedRegion}
            psiItems={psiItems}
            pm25Items={pm25Items}
          />
        </section>

        {/* Health Advisory Guidelines */}
        <section>
          <HealthAdvisoryCard
            psi={currentRealPsi}
            bandInfo={realBandInfo}
          />
        </section>

        {/* Detailed Pollutants Breakdown */}
        <section>
          <PollutantBreakdown
            currentRegion={selectedRegion}
            readings={latestPsiItem?.readings || {}}
            pm25OneHour={currentRealPm25_1h}
          />
        </section>

        {/* Footer */}
        <footer className="pt-8 pb-12 border-t border-slate-800/80 text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-teal-400" />
            <span>
              Real-time NEA Singapore Data Source via Data.gov.sg API v2.
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsHealthModalOpen(true)}
              className="text-teal-400 hover:text-teal-300 underline underline-offset-2 flex items-center gap-1"
            >
              <Server className="w-3.5 h-3.5" />
              <span>API Health Monitor (/api/health.js)</span>
            </button>
            <span>·</span>
            <span>Auto-refreshes every 5m</span>
          </div>
        </footer>
      </div>

      {/* API Health Monitor Modal */}
      <ApiHealthModal
        isOpen={isHealthModalOpen}
        onClose={() => setIsHealthModalOpen(false)}
        healthData={healthData}
        isLoading={isHealthLoading}
        onRefresh={handleRefreshHealth}
      />
    </div>
  );
}
