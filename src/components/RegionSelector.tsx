import React from 'react';
import { RegionName } from '../types/airQuality';
import { REGION_CENTROIDS, getPsiBandInfo } from '../services/airQualityService';
import { MapPin, Crosshair, Loader2, Navigation, CheckCircle2 } from 'lucide-react';

interface RegionSelectorProps {
  currentRegion: RegionName;
  onSelectRegion: (region: RegionName) => void;
  psiMap: Record<RegionName, number>;
  pm25Map: Record<RegionName, number>;
  userLocation: {
    lat: number;
    lng: number;
    region: RegionName;
    distanceKm: number;
  } | null;
  isLocating: boolean;
  onDetectLocation: () => void;
  locationError: string | null;
}

export const RegionSelector: React.FC<RegionSelectorProps> = ({
  currentRegion,
  onSelectRegion,
  psiMap,
  pm25Map,
  userLocation,
  isLocating,
  onDetectLocation,
  locationError,
}) => {
  const regions: RegionName[] = ['north', 'south', 'east', 'west', 'central'];

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800/80 p-4 md:p-5 backdrop-blur-md shadow-xl text-slate-100">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-teal-400" />
            <h2 className="text-sm md:text-base font-bold text-white">
              Monitor Region & Location
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Select your Singapore zone or use GPS auto-detection
          </p>
        </div>

        {/* GPS Locate Me Button */}
        <button
          onClick={onDetectLocation}
          disabled={isLocating}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
            userLocation
              ? 'bg-teal-500/10 text-teal-300 border-teal-500/40 hover:bg-teal-500/20'
              : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-750 hover:border-slate-600'
          }`}
          title="Auto-detect closest Singapore region via device GPS"
        >
          {isLocating ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-400" />
              <span>Detecting GPS...</span>
            </>
          ) : userLocation ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
              <span>GPS: Nearest {REGION_CENTROIDS[userLocation.region].label}</span>
            </>
          ) : (
            <>
              <Crosshair className="w-3.5 h-3.5 text-teal-400" />
              <span>Detect My Location</span>
            </>
          )}
        </button>
      </div>

      {/* Detected Location Status Bar */}
      {userLocation && (
        <div className="mt-3 py-2 px-3 rounded-xl bg-teal-950/40 border border-teal-500/30 text-xs text-teal-200 flex items-center justify-between animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <Navigation className="w-3.5 h-3.5 text-teal-400 shrink-0" />
            <span>
              Device GPS locked at <b>{userLocation.lat.toFixed(3)}, {userLocation.lng.toFixed(3)}</b> · Approx{' '}
              <b>{userLocation.distanceKm} km</b> to {REGION_CENTROIDS[userLocation.region].label} sensor
            </span>
          </div>
          <span className="text-[11px] text-teal-400 font-medium hidden sm:inline">
            Active
          </span>
        </div>
      )}

      {locationError && (
        <div className="mt-3 py-2 px-3 rounded-xl bg-amber-950/40 border border-amber-500/30 text-xs text-amber-200">
          {locationError}
        </div>
      )}

      {/* Region Grid Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-3.5">
        {regions.map((r) => {
          const isSelected = r === currentRegion;
          const isClosest = userLocation?.region === r;
          const psi = psiMap[r] || 0;
          const pm25 = pm25Map[r] || 0;
          const band = getPsiBandInfo(psi);

          return (
            <button
              key={r}
              onClick={() => onSelectRegion(r)}
              className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden ${
                isSelected
                  ? 'bg-slate-800/90 border-teal-500/60 shadow-lg ring-1 ring-teal-500/30 text-white'
                  : 'bg-slate-800/40 border-slate-750 text-slate-300 hover:bg-slate-800/70 hover:border-slate-700'
              }`}
            >
              {isClosest && (
                <div className="absolute top-1.5 right-1.5">
                  <span className="flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold capitalize text-white">
                  {REGION_CENTROIDS[r].label}
                </span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${band.textColor}`}
                >
                  {band.label}
                </span>
              </div>

              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-lg font-black font-mono text-white">
                  {psi}
                </span>
                <span className="text-[10px] text-slate-400">PSI</span>
                <span className="text-xs font-mono font-medium text-amber-300 ml-auto">
                  {pm25} <span className="text-[9px] text-slate-400">µg</span>
                </span>
              </div>

              <div className="text-[10px] text-slate-400 mt-1 truncate">
                {REGION_CENTROIDS[r].neighborhoods.split(',')[0]}...
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
