import React from 'react';
import { PsiReadings, RegionName } from '../types/airQuality';
import { Atom, Gauge, Info } from 'lucide-react';
import { getPm25Category } from '../services/airQualityService';

interface PollutantBreakdownProps {
  currentRegion: RegionName;
  readings: PsiReadings;
  pm25OneHour: number;
}

export const PollutantBreakdown: React.FC<PollutantBreakdownProps> = ({
  currentRegion,
  readings,
  pm25OneHour,
}) => {
  const pm25_24h = readings.pm25_twenty_four_hourly?.[currentRegion] ?? 0;
  const pm10_24h = readings.pm10_twenty_four_hourly?.[currentRegion] ?? 0;
  const so2_24h = readings.so2_twenty_four_hourly?.[currentRegion] ?? 0;
  const no2_1h = readings.no2_one_hour_max?.[currentRegion] ?? 0;
  const co_8h = readings.co_eight_hour_max?.[currentRegion] ?? 0;
  const o3_8h = readings.o3_eight_hour_max?.[currentRegion] ?? 0;

  const pm25Cat = getPm25Category(pm25OneHour);

  const pollutants = [
    {
      name: 'PM2.5 (1-Hour)',
      value: pm25OneHour,
      unit: 'µg/m³',
      desc: 'Fine inhalable particles (< 2.5µm). Primary haze factor.',
      status: pm25Cat.label,
      statusClass: pm25Cat.badgeClass,
      threshold: 'Normal ≤ 55',
    },
    {
      name: 'PM2.5 (24-Hour)',
      value: pm25_24h,
      unit: 'µg/m³',
      desc: '24-hour mean concentration for prolonged exposure.',
      status: pm25_24h <= 55 ? 'Normal' : 'Elevated',
      statusClass: pm25_24h <= 55 ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' : 'text-amber-400 bg-amber-500/10 border-amber-500/30',
      threshold: 'NEA Target: ≤ 25',
    },
    {
      name: 'PM10 (24-Hour)',
      value: pm10_24h,
      unit: 'µg/m³',
      desc: 'Inhalable coarse particles like dust, soot and pollen.',
      status: pm10_24h <= 50 ? 'Good' : pm10_24h <= 100 ? 'Moderate' : 'Unhealthy',
      statusClass: pm10_24h <= 50 ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' : 'text-sky-400 bg-sky-500/10 border-sky-500/30',
      threshold: 'Good ≤ 50',
    },
    {
      name: 'Ozone (O₃ 8h Max)',
      value: o3_8h,
      unit: 'µg/m³',
      desc: 'Ground-level secondary pollutant from chemical reactions.',
      status: o3_8h <= 100 ? 'Good' : 'Moderate',
      statusClass: o3_8h <= 100 ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' : 'text-sky-400 bg-sky-500/10 border-sky-500/30',
      threshold: 'Good ≤ 100',
    },
    {
      name: 'Nitrogen Dioxide (NO₂)',
      value: no2_1h,
      unit: 'µg/m³',
      desc: 'Combustion gas from vehicular traffic and industrial emissions.',
      status: no2_1h <= 40 ? 'Good' : 'Moderate',
      statusClass: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      threshold: 'Standard ≤ 200',
    },
    {
      name: 'Sulphur Dioxide (SO₂)',
      value: so2_24h,
      unit: 'µg/m³',
      desc: 'Combustion byproduct from petrochemical processing.',
      status: 'Normal',
      statusClass: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      threshold: 'WHO Guideline ≤ 40',
    },
    {
      name: 'Carbon Monoxide (CO)',
      value: co_8h,
      unit: 'mg/m³',
      desc: 'Colorless, odorless gas from incomplete combustion.',
      status: 'Normal',
      statusClass: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      threshold: 'Standard ≤ 9',
    },
  ];

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800/80 p-5 md:p-6 backdrop-blur-md shadow-xl text-slate-100">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Atom className="w-5 h-5 text-teal-400" />
          <h2 className="text-base md:text-lg font-bold text-white tracking-tight">
            Detailed Pollutant Breakdown
          </h2>
        </div>
        <span className="text-xs text-slate-400 font-mono capitalize">
          {currentRegion} Region
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mt-5">
        {pollutants.map((p) => (
          <div
            key={p.name}
            className="bg-slate-800/40 rounded-xl p-3.5 border border-slate-800 hover:border-slate-700 transition-colors flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-1 mb-1.5">
                <span className="text-xs font-semibold text-slate-200 truncate">
                  {p.name}
                </span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-md border font-medium ${p.statusClass}`}
                >
                  {p.status}
                </span>
              </div>
              <div className="flex items-baseline gap-1.5 mb-2">
                <span className="text-2xl font-black text-white font-mono">
                  {p.value}
                </span>
                <span className="text-xs text-slate-400 font-sans">{p.unit}</span>
              </div>
              <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                {p.desc}
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-800 text-[10px] text-slate-400 flex justify-between">
              <span>Standard:</span>
              <span className="font-mono text-slate-400">{p.threshold}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
