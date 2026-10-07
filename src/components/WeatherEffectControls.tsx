import React, { useEffect, useRef, useState } from 'react';
import {
  CloudFog,
  Wind,
  Volume2,
  VolumeX,
  Sliders,
  RotateCcw,
  Sparkles,
  Info,
} from 'lucide-react';
import { AirQualityBand } from '../types/airQuality';
import { getPsiBandInfo } from '../services/airQualityService';

interface WeatherEffectControlsProps {
  realPsi: number;
  activePsi: number;
  isSimulating: boolean;
  onSimulatePsiChange: (psi: number | null) => void;
  isEnabled: boolean;
  onToggleEnabled: () => void;
  intensityScale: number;
  onChangeIntensity: (scale: number) => void;
  windSpeed: number;
  onChangeWindSpeed: (speed: number) => void;
}

export const WeatherEffectControls: React.FC<WeatherEffectControlsProps> = ({
  realPsi,
  activePsi,
  isSimulating,
  onSimulatePsiChange,
  isEnabled,
  onToggleEnabled,
  intensityScale,
  onChangeIntensity,
  windSpeed,
  onChangeWindSpeed,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  // Web Audio wind synthesis
  useEffect(() => {
    if (!isAudioPlaying) {
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
        audioCtxRef.current = null;
      }
      return;
    }

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      // Pink/White noise generator buffer
      const bufferSize = ctx.sampleRate * 2;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.04;
        b6 = white * 0.115926;
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      // Bandpass / Lowpass filter to simulate atmospheric wind draft
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 350 + windSpeed * 80;
      filter.Q.value = 3.0;

      const gain = ctx.createGain();
      gain.gain.value = 0.15;
      gainNodeRef.current = gain;

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      whiteNoise.start();

      return () => {
        try {
          whiteNoise.stop();
          ctx.close();
        } catch {}
      };
    } catch {
      // Audio not supported or blocked
      setIsAudioPlaying(false);
    }
  }, [isAudioPlaying, windSpeed]);

  const activeBandInfo = getPsiBandInfo(activePsi);

  const presets = [
    { label: 'Good', value: 30, color: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10' },
    { label: 'Moderate', value: 75, color: 'text-sky-400 border-sky-500/40 bg-sky-500/10' },
    { label: 'Unhealthy', value: 145, color: 'text-amber-400 border-amber-500/40 bg-amber-500/10' },
    { label: 'Very Unhealthy', value: 240, color: 'text-red-400 border-red-500/40 bg-red-500/10' },
    { label: 'Hazardous', value: 340, color: 'text-purple-400 border-purple-500/40 bg-purple-500/10' },
  ];

  return (
    <div className="relative z-30">
      {/* Floating Weather Effects Trigger Pill */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium border backdrop-blur-md transition-all shadow-sm ${
            isEnabled
              ? isSimulating
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                : 'bg-slate-900/80 text-slate-200 border-slate-700 hover:border-slate-500'
              : 'bg-slate-900/50 text-slate-400 border-slate-800 line-through opacity-75'
          }`}
          title="Adjust haze atmospheric effects & test smog simulation"
        >
          <CloudFog className={`w-3.5 h-3.5 ${isEnabled ? 'text-amber-400 animate-pulse' : 'text-slate-500'}`} />
          <span>Haze Effect: {isEnabled ? (isSimulating ? `Sim (${activePsi})` : 'Live') : 'Off'}</span>
          <Sliders className="w-3 h-3 text-slate-400 ml-0.5" />
        </button>

        {isEnabled && (
          <button
            onClick={() => setIsAudioPlaying(!isAudioPlaying)}
            className={`p-1.5 rounded-full border backdrop-blur-md transition-all text-xs ${
              isAudioPlaying
                ? 'bg-teal-500/20 border-teal-500/40 text-teal-300 shadow-sm shadow-teal-500/20'
                : 'bg-slate-900/80 border-slate-750 text-slate-400 hover:text-slate-200'
            }`}
            title={isAudioPlaying ? 'Mute ambient wind sound' : 'Play ambient wind sound effect'}
          >
            {isAudioPlaying ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>

      {/* Popover Settings Drawer */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs md:hidden"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-10 z-50 w-80 md:w-96 rounded-2xl bg-slate-900/95 border border-slate-750 shadow-2xl backdrop-blur-xl p-5 text-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <CloudFog className="w-4 h-4 text-amber-400" />
                <h3 className="font-semibold text-sm text-slate-100">Weather & Haze Overlay</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-xs text-slate-400 hover:text-slate-200 px-2 py-0.5 rounded-md hover:bg-slate-800"
              >
                Done
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              {/* Overlay Master Switch */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-slate-200">Atmospheric Overlay</div>
                  <div className="text-slate-400 text-[11px]">Visual fog, soot motes, and tint</div>
                </div>
                <button
                  onClick={onToggleEnabled}
                  className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${
                    isEnabled ? 'bg-amber-500' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                      isEnabled ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Simulation vs Live Mode */}
              <div className="pt-2 border-t border-slate-800/80">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-slate-200">Haze Intensity Source</span>
                  {isSimulating ? (
                    <button
                      onClick={() => onSimulatePsiChange(null)}
                      className="flex items-center gap-1 text-[11px] text-teal-400 hover:text-teal-300 font-medium"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Reset to Live ({realPsi})
                    </button>
                  ) : (
                    <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Live NEA Reading
                    </span>
                  )}
                </div>

                {/* Status preview banner */}
                <div
                  className={`p-2.5 rounded-xl border flex items-center justify-between mb-3 ${activeBandInfo.bgLight} ${activeBandInfo.borderColor}`}
                >
                  <div>
                    <div className="text-[10px] uppercase tracking-wider font-semibold opacity-75">
                      Current Effect Level
                    </div>
                    <div className="text-sm font-bold flex items-center gap-1.5">
                      <span className={activeBandInfo.textColor}>{activeBandInfo.label}</span>
                      <span className="text-slate-400 text-xs">· PSI {activePsi}</span>
                    </div>
                  </div>
                  <div className="text-[11px] text-right text-slate-400 max-w-[120px] leading-tight">
                    {activePsi <= 50
                      ? 'Clear crystal sky'
                      : activePsi <= 100
                      ? 'Subtle mist haze'
                      : activePsi <= 200
                      ? 'Particulate smog layer'
                      : 'Dense acrid smoke blanketing'}
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="text-[11px] text-slate-400 mb-1.5 font-medium">Test Haze Levels:</div>
                <div className="grid grid-cols-5 gap-1.5 mb-3">
                  {presets.map((p) => {
                    const isSelected = isSimulating && Math.abs(activePsi - p.value) < 15;
                    return (
                      <button
                        key={p.label}
                        onClick={() => onSimulatePsiChange(p.value)}
                        className={`py-1.5 px-1 rounded-lg border text-center transition-all ${
                          isSelected ? `${p.color} ring-1 ring-white/30 font-bold` : 'bg-slate-800/80 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <div className="text-[10px] truncate">{p.label}</div>
                        <div className="text-[11px] font-semibold">{p.value}</div>
                      </button>
                    );
                  })}
                </div>

                {/* PSI Slider */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Custom PSI: <b className="text-slate-200">{activePsi}</b></span>
                    <span>0 – 400</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="400"
                    step="5"
                    value={activePsi}
                    onChange={(e) => onSimulatePsiChange(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                </div>
              </div>

              {/* Advanced particle & wind controls */}
              <div className="pt-2 border-t border-slate-800/80 space-y-3">
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-400">Density Multiplier:</span>
                    <span className="font-medium text-slate-200">{intensityScale}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.25"
                    value={intensityScale}
                    onChange={(e) => onChangeIntensity(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Wind className="w-3 h-3 text-slate-400" /> Wind Velocity:
                    </span>
                    <span className="font-medium text-slate-200">
                      {windSpeed === 1 ? 'Calm' : windSpeed <= 3 ? 'Breeze' : 'Gusty'} ({windSpeed}x)
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="1"
                    value={windSpeed}
                    onChange={(e) => onChangeWindSpeed(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-500"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-400 flex items-start gap-1.5 leading-relaxed">
                <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                <span>
                  The animated weather overlay dynamically renders particulate smog motes and atmospheric fog based on live NEA PSI readings.
                </span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
