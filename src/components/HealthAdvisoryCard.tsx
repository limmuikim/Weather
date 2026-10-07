import React from 'react';
import { AirQualityBand, AirQualityInfo } from '../types/airQuality';
import {
  ShieldAlert,
  HeartPulse,
  UserCheck,
  Dumbbell,
  Wind,
  Home,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

interface HealthAdvisoryCardProps {
  psi: number;
  bandInfo: AirQualityInfo;
}

export const HealthAdvisoryCard: React.FC<HealthAdvisoryCardProps> = ({
  psi,
  bandInfo,
}) => {
  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800/80 p-5 md:p-6 backdrop-blur-md shadow-xl text-slate-100">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-amber-400" />
          <h2 className="text-base md:text-lg font-bold text-white tracking-tight">
            NEA Health Advisory Guidelines
          </h2>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Current Status:</span>
          <span
            className={`font-bold px-2 py-0.5 rounded-full border ${bandInfo.bgLight} ${bandInfo.textColor} ${bandInfo.borderColor}`}
          >
            {bandInfo.label} (PSI {psi})
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
        {/* Healthy Persons */}
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-750 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-teal-400 mb-2">
              <UserCheck className="w-4 h-4" />
              <h3 className="font-semibold text-xs uppercase tracking-wider">
                Healthy Persons
              </h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {bandInfo.healthAdvice.general}
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-700/60 text-[11px] text-slate-400">
            {psi <= 100
              ? '✓ No activity restrictions needed'
              : psi <= 200
              ? '⚠ Take breaks during workouts'
              : '⛔ Move workouts indoors'}
          </div>
        </div>

        {/* Vulnerable Persons */}
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-750 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-amber-400 mb-2">
              <HeartPulse className="w-4 h-4" />
              <h3 className="font-semibold text-xs uppercase tracking-wider">
                Vulnerable Groups
              </h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {bandInfo.healthAdvice.vulnerable}
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-700/60 text-[11px] text-slate-400">
            Elderly, children & asthma patients
          </div>
        </div>

        {/* Outdoor Strenuous Activities */}
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-750 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-sky-400 mb-2">
              <Dumbbell className="w-4 h-4" />
              <h3 className="font-semibold text-xs uppercase tracking-wider">
                Sports & Exercise
              </h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {bandInfo.healthAdvice.outdoorActivity}
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-700/60 text-[11px] text-slate-400">
            Running, cycling, high cardio
          </div>
        </div>

        {/* Protective Measures & Mask */}
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-750 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-rose-400 mb-2">
              <Wind className="w-4 h-4" />
              <h3 className="font-semibold text-xs uppercase tracking-wider">
                Respirator & Indoors
              </h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {bandInfo.healthAdvice.maskRecommendation}
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-700/60 text-[11px] text-slate-400 flex items-center gap-1">
            <Home className="w-3.5 h-3.5 text-slate-400" />
            <span>{psi > 100 ? 'Keep windows shut' : 'Normal ventilation'}</span>
          </div>
        </div>
      </div>

      {/* Advisory Quick Tips Footer */}
      <div className="mt-4 p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300">
        <div className="flex items-center gap-2">
          {psi <= 100 ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          )}
          <span>
            {psi <= 100
              ? 'Air quality is within acceptable range. Enjoy outdoor activities responsibly.'
              : psi <= 200
              ? 'Haze present. Drink plenty of water and seek medical advice if feeling unwell.'
              : 'Severe haze episode. Stay indoors, utilize HEPA air filtration, and avoid outdoor exposure.'}
          </span>
        </div>
        <a
          href="https://www.nea.gov.sg/our-services/pollution-control/air-quality/faqs#health-advisories"
          target="_blank"
          rel="noopener noreferrer"
          className="text-teal-400 hover:text-teal-300 text-xs font-medium underline underline-offset-2 shrink-0"
        >
          Official NEA FAQ &rarr;
        </a>
      </div>
    </div>
  );
};
