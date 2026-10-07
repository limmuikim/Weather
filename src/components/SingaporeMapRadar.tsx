import React from 'react';
import { RegionName } from '../types/airQuality';
import { getPsiBandInfo, getPm25Category, REGION_CENTROIDS } from '../services/airQualityService';
import { MapPin, Navigation } from 'lucide-react';

interface SingaporeMapRadarProps {
  selectedRegion: RegionName;
  onSelectRegion: (region: RegionName) => void;
  psiReadings: Record<RegionName, number>;
  pm25Readings: Record<RegionName, number>;
  userLocation: { lat: number; lng: number; region: RegionName } | null;
}

export const SingaporeMapRadar: React.FC<SingaporeMapRadarProps> = ({
  selectedRegion,
  onSelectRegion,
  psiReadings,
  pm25Readings,
  userLocation,
}) => {
  // SVG coordinates mapping for Singapore map layout (viewBox 0 0 600 360)
  const regionCoords: Record<
    RegionName,
    { x: number; y: number; labelX: number; labelY: number }
  > = {
    north: { x: 300, y: 90, labelX: 300, labelY: 65 },
    west: { x: 155, y: 195, labelX: 135, labelY: 170 },
    central: { x: 300, y: 195, labelX: 300, labelY: 170 },
    east: { x: 445, y: 195, labelX: 465, labelY: 170 },
    south: { x: 300, y: 290, labelX: 300, labelY: 315 },
  };

  // Convert GPS to SVG coordinates roughly for Singapore (bounds: lat 1.22-1.47, lng 103.6-104.0)
  const getGpsSvgCoord = (lat: number, lng: number) => {
    const minLat = 1.22,
      maxLat = 1.47;
    const minLng = 103.6,
      maxLng = 104.04;
    const x = ((lng - minLng) / (maxLng - minLng)) * 500 + 50;
    const y = 360 - ((lat - minLat) / (maxLat - minLat)) * 300 - 30;
    return { x: Math.max(50, Math.min(550, x)), y: Math.max(40, Math.min(320, y)) };
  };

  const userSvgPos = userLocation
    ? getGpsSvgCoord(userLocation.lat, userLocation.lng)
    : null;

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800/80 p-5 md:p-6 backdrop-blur-md shadow-xl text-slate-100 flex flex-col justify-between">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Navigation className="w-4 h-4 text-teal-400" />
          <h2 className="text-sm md:text-base font-bold text-white">
            Singapore Regional Radar Map
          </h2>
        </div>
        <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
          <span>Tap any region to inspect</span>
        </div>
      </div>

      {/* SVG Map Canvas */}
      <div className="relative my-3 w-full aspect-[600/360] flex items-center justify-center">
        <svg
          viewBox="0 0 600 360"
          className="w-full h-full drop-shadow-md select-none"
        >
          <defs>
            {/* Grid Pattern */}
            <pattern id="radarGrid" width="30" height="30" patternUnits="userSpaceOnUse">
              <path
                d="M 30 0 L 0 0 0 30"
                fill="none"
                stroke="#1e293b"
                strokeWidth="0.7"
                strokeOpacity="0.4"
              />
            </pattern>

            {/* Glowing filters */}
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background Grid */}
          <rect width="600" height="360" fill="url(#radarGrid)" rx="16" />

          {/* Concentric Singapore Radar Rings */}
          <circle cx="300" cy="195" r="90" fill="none" stroke="#334155" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.4" />
          <circle cx="300" cy="195" r="160" fill="none" stroke="#334155" strokeWidth="0.8" strokeDasharray="4 4" opacity="0.3" />

          {/* Stylized Singapore Island Silhouette */}
          <path
            d="M 80,190 C 95,170 120,150 160,140 C 200,130 250,90 300,80 C 340,75 380,95 410,120 C 440,140 500,165 520,185 C 530,195 515,225 470,230 C 430,235 390,245 350,260 C 310,275 270,270 230,255 C 190,240 130,245 95,225 C 75,215 70,200 80,190 Z"
            fill="#0f172a"
            stroke="#334155"
            strokeWidth="2"
            opacity="0.85"
          />

          {/* Sentosa / Southern Islands */}
          <ellipse cx="280" cy="290" rx="35" ry="12" fill="#0f172a" stroke="#334155" strokeWidth="1.5" opacity="0.8" />
          {/* Pulau Ubin */}
          <ellipse cx="460" cy="130" rx="28" ry="10" fill="#0f172a" stroke="#334155" strokeWidth="1.5" opacity="0.8" />

          {/* Connector lines between regions */}
          <line x1="300" y1="90" x2="300" y2="195" stroke="#334155" strokeWidth="1" strokeDasharray="2 2" opacity="0.5" />
          <line x1="155" y1="195" x2="300" y2="195" stroke="#334155" strokeWidth="1" strokeDasharray="2 2" opacity="0.5" />
          <line x1="300" y1="195" x2="445" y2="195" stroke="#334155" strokeWidth="1" strokeDasharray="2 2" opacity="0.5" />
          <line x1="300" y1="195" x2="300" y2="290" stroke="#334155" strokeWidth="1" strokeDasharray="2 2" opacity="0.5" />

          {/* 5 NEA Region Nodes */}
          {(['north', 'south', 'east', 'west', 'central'] as RegionName[]).map((region) => {
            const pos = regionCoords[region];
            const isSelected = region === selectedRegion;
            const psi = psiReadings[region] || 0;
            const pm25 = pm25Readings[region] || 0;
            const bandInfo = getPsiBandInfo(psi);
            const pm25Cat = getPm25Category(pm25);

            return (
              <g
                key={region}
                className="cursor-pointer transition-transform"
                onClick={() => onSelectRegion(region)}
              >
                {/* Active Selection Halo Ring */}
                {isSelected && (
                  <>
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r="40"
                      fill="none"
                      stroke={bandInfo.colorHex}
                      strokeWidth="2"
                      strokeDasharray="4 2"
                      opacity="0.8"
                      className="animate-spin"
                      style={{ transformOrigin: `${pos.x}px ${pos.y}px`, animationDuration: '10s' }}
                    />
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r="34"
                      fill={bandInfo.colorHex}
                      fillOpacity="0.12"
                    />
                  </>
                )}

                {/* Radar pulse for high psi */}
                {psi > 100 && (
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r="28"
                    fill="none"
                    stroke={bandInfo.colorHex}
                    strokeWidth="1.5"
                    opacity="0.4"
                    className="animate-ping"
                    style={{ transformOrigin: `${pos.x}px ${pos.y}px` }}
                  />
                )}

                {/* Main Node Circle */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={isSelected ? 26 : 22}
                  fill="#090d16"
                  stroke={bandInfo.colorHex}
                  strokeWidth={isSelected ? 3 : 2}
                  filter={isSelected ? 'url(#glow)' : undefined}
                />

                {/* PSI value inside node */}
                <text
                  x={pos.x}
                  y={pos.y - 2}
                  fill="#ffffff"
                  fontSize={isSelected ? '14' : '12'}
                  fontWeight="bold"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontFamily="sans-serif"
                >
                  {psi}
                </text>
                <text
                  x={pos.x}
                  y={pos.y + 11}
                  fill="#94a3b8"
                  fontSize="8"
                  textAnchor="middle"
                  fontFamily="monospace"
                >
                  PSI
                </text>

                {/* Region Label & PM2.5 Tag */}
                <rect
                  x={pos.labelX - 44}
                  y={pos.labelY - 11}
                  width="88"
                  height="22"
                  rx="6"
                  fill="#0b1120"
                  stroke={isSelected ? bandInfo.colorHex : '#1e293b'}
                  strokeWidth="1"
                  opacity="0.95"
                />
                <text
                  x={pos.labelX}
                  y={pos.labelY + 3.5}
                  fill={isSelected ? '#38bdf8' : '#e2e8f0'}
                  fontSize="10"
                  fontWeight="600"
                  textAnchor="middle"
                  dominantBaseline="middle"
                >
                  {REGION_CENTROIDS[region].label} · {pm25} µg
                </text>
              </g>
            );
          })}

          {/* User Location GPS Pin */}
          {userSvgPos && (
            <g>
              <circle
                cx={userSvgPos.x}
                cy={userSvgPos.y}
                r="14"
                fill="#38bdf8"
                fillOpacity="0.25"
                className="animate-ping"
                style={{ transformOrigin: `${userSvgPos.x}px ${userSvgPos.y}px` }}
              />
              <circle
                cx={userSvgPos.x}
                cy={userSvgPos.y}
                r="5"
                fill="#38bdf8"
                stroke="#ffffff"
                strokeWidth="2"
              />
              <text
                x={userSvgPos.x}
                y={userSvgPos.y - 10}
                fill="#38bdf8"
                fontSize="9"
                fontWeight="bold"
                textAnchor="middle"
              >
                YOU
              </text>
            </g>
          )}
        </svg>
      </div>

      {/* Quick Region Selector Pills */}
      <div className="grid grid-cols-5 gap-1.5 pt-2 border-t border-slate-800">
        {(['north', 'south', 'east', 'west', 'central'] as RegionName[]).map((r) => {
          const isSelected = r === selectedRegion;
          const psi = psiReadings[r] || 0;
          const band = getPsiBandInfo(psi);
          return (
            <button
              key={r}
              onClick={() => onSelectRegion(r)}
              className={`py-2 px-1 rounded-xl text-center border transition-all ${
                isSelected
                  ? 'bg-slate-800 border-teal-500/60 shadow-md ring-1 ring-teal-500/40 text-white'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
              }`}
            >
              <div className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">
                {r}
              </div>
              <div className="text-sm font-bold flex items-center justify-center gap-1 mt-0.5">
                <span className={band.textColor}>{psi}</span>
              </div>
              <div className="text-[9px] text-slate-400 mt-0.5">
                {pm25Readings[r] || 0} µg
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
