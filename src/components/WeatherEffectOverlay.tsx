import React, { useEffect, useRef, useState } from 'react';
import { AirQualityBand } from '../types/airQuality';

interface WeatherEffectOverlayProps {
  psi: number;
  band: AirQualityBand;
  isEnabled: boolean;
  intensityScale?: number; // 0.5 to 2.0 multiplier
  windSpeed?: number; // 1 to 5
}

interface Particle {
  x: number;
  y: number;
  radius: number;
  vx: number;
  vy: number;
  alpha: number;
  baseAlpha: number;
  life: number;
  maxLife: number;
  wobbleSpeed: number;
  wobbleRadius: number;
  colorType: 'dust' | 'smog' | 'soot';
}

export const WeatherEffectOverlay: React.FC<WeatherEffectOverlayProps> = ({
  psi,
  band,
  isEnabled,
  intensityScale = 1.0,
  windSpeed = 2,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Compute atmospheric parameters based on PSI
  // Good: 0-50, Moderate: 51-100, Unhealthy: 101-200, Very Unhealthy: 201-300, Hazardous: >300
  const normalizedPsi = Math.max(0, Math.min(psi, 400));
  
  // Opacity of atmospheric haze wash
  let ambientWashOpacity = 0;
  let ambientTint = 'rgba(217, 119, 6, 0.15)'; // warm amber smog
  let targetParticleCount = 12;

  if (normalizedPsi <= 50) {
    // Good: Crystal clear sky, very subtle dust motes
    ambientWashOpacity = 0.02;
    ambientTint = 'rgba(16, 185, 129, 0.05)';
    targetParticleCount = 8;
  } else if (normalizedPsi <= 100) {
    // Moderate: Faint mist
    ambientWashOpacity = 0.08 * intensityScale;
    ambientTint = 'rgba(180, 185, 195, 0.12)';
    targetParticleCount = Math.round(25 * intensityScale);
  } else if (normalizedPsi <= 150) {
    // Unhealthy lower: visible amber haze
    ambientWashOpacity = (0.16 + (normalizedPsi - 100) * 0.002) * intensityScale;
    ambientTint = 'rgba(217, 119, 6, 0.22)';
    targetParticleCount = Math.round((45 + (normalizedPsi - 100) * 0.6) * intensityScale);
  } else if (normalizedPsi <= 200) {
    // Unhealthy upper: thick sepia/amber smog
    ambientWashOpacity = (0.26 + (normalizedPsi - 150) * 0.003) * intensityScale;
    ambientTint = 'rgba(202, 100, 12, 0.32)';
    targetParticleCount = Math.round((75 + (normalizedPsi - 150) * 0.8) * intensityScale);
  } else if (normalizedPsi <= 300) {
    // Very Unhealthy: Dense brownish smog blanket
    ambientWashOpacity = (0.40 + (normalizedPsi - 200) * 0.002) * intensityScale;
    ambientTint = 'rgba(185, 50, 20, 0.42)';
    targetParticleCount = Math.round((115 + (normalizedPsi - 200) * 0.7) * intensityScale);
  } else {
    // Hazardous: Toxic dark acrid smog
    ambientWashOpacity = (0.58 + (normalizedPsi - 300) * 0.001) * intensityScale;
    ambientTint = 'rgba(120, 20, 40, 0.55)';
    targetParticleCount = Math.round(180 * intensityScale);
  }

  // Particle simulation loop
  useEffect(() => {
    if (!isEnabled) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const particles: Particle[] = [];

    const createParticle = (spawnEverywhere = false): Particle => {
      const isSmog = normalizedPsi > 80;
      const isSoot = normalizedPsi > 160 && Math.random() < 0.35;
      const colorType: 'dust' | 'smog' | 'soot' = isSoot ? 'soot' : isSmog ? 'smog' : 'dust';

      // Smog particles are softer & larger; soot is darker & granular
      const radius = colorType === 'soot'
        ? Math.random() * 2 + 1
        : colorType === 'smog'
        ? Math.random() * 8 + 3
        : Math.random() * 2.5 + 0.8;

      const baseAlpha = colorType === 'soot'
        ? Math.random() * 0.4 + 0.2
        : colorType === 'smog'
        ? Math.random() * 0.35 + 0.15
        : Math.random() * 0.15 + 0.05;

      const baseVx = (Math.random() * 0.8 + 0.4) * (windSpeed * 0.7);
      const baseVy = (Math.random() - 0.45) * 0.5;

      return {
        x: spawnEverywhere ? Math.random() * width : -20,
        y: spawnEverywhere ? Math.random() * height : Math.random() * height,
        radius,
        vx: baseVx,
        vy: baseVy,
        alpha: baseAlpha,
        baseAlpha,
        life: 0,
        maxLife: Math.random() * 400 + 300,
        wobbleSpeed: Math.random() * 0.02 + 0.01,
        wobbleRadius: Math.random() * 1.5 + 0.5,
        colorType,
      };
    };

    // Initialize particles
    for (let i = 0; i < targetParticleCount; i++) {
      particles.push(createParticle(true));
    }

    let frame = 0;

    const render = () => {
      frame++;
      ctx.clearRect(0, 0, width, height);

      // Adjust particle count smoothly
      if (particles.length < targetParticleCount && frame % 10 === 0) {
        particles.push(createParticle(false));
      } else if (particles.length > targetParticleCount) {
        particles.pop();
      }

      // Draw subtle ambient fog layers in canvas if hazy
      if (normalizedPsi > 70) {
        const fogLayers = normalizedPsi > 180 ? 3 : 2;
        for (let l = 0; l < fogLayers; l++) {
          const shift = (frame * 0.3 * (l + 1) * (windSpeed / 2)) % width;
          const grad = ctx.createLinearGradient(0, 0, width, height);
          
          if (normalizedPsi > 250) {
            grad.addColorStop(0, `rgba(160, 45, 20, ${0.08 * intensityScale})`);
            grad.addColorStop(0.5, `rgba(180, 80, 30, ${0.12 * intensityScale})`);
            grad.addColorStop(1, `rgba(140, 35, 15, ${0.09 * intensityScale})`);
          } else if (normalizedPsi > 150) {
            grad.addColorStop(0, `rgba(217, 119, 6, ${0.06 * intensityScale})`);
            grad.addColorStop(0.5, `rgba(245, 158, 11, ${0.09 * intensityScale})`);
            grad.addColorStop(1, `rgba(180, 83, 9, ${0.07 * intensityScale})`);
          } else {
            grad.addColorStop(0, `rgba(200, 205, 215, ${0.04 * intensityScale})`);
            grad.addColorStop(1, `rgba(160, 170, 185, ${0.05 * intensityScale})`);
          }

          ctx.fillStyle = grad;
          // Soft sweeping haze band
          ctx.beginPath();
          const yCenter = (height * (l + 1)) / (fogLayers + 1);
          ctx.ellipse(
            (shift + width * (l * 0.4)) % width,
            yCenter + Math.sin(frame * 0.01 + l) * 40,
            width * 0.6,
            height * 0.35,
            0,
            0,
            Math.PI * 2
          );
          ctx.fill();
        }
      }

      // Render individual particles (dust, smog plumes, soot)
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.life++;
        p.x += p.vx;
        p.y += p.vy + Math.sin(p.life * p.wobbleSpeed) * p.wobbleRadius;

        // Wrap around screen
        if (p.x > width + 30) {
          p.x = -20;
          p.y = Math.random() * height;
          p.life = 0;
        }
        if (p.y < -30) p.y = height + 20;
        if (p.y > height + 30) p.y = -20;

        // Fade in and fade out smoothly
        const lifeFraction = p.life / p.maxLife;
        let fade = 1;
        if (lifeFraction < 0.2) fade = lifeFraction / 0.2;
        else if (lifeFraction > 0.8) fade = (1 - lifeFraction) / 0.2;
        const currentAlpha = p.baseAlpha * Math.max(0, Math.min(1, fade));

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);

        if (p.colorType === 'soot') {
          // Darker particulate speck
          ctx.fillStyle = `rgba(55, 45, 40, ${currentAlpha * 0.85})`;
        } else if (p.colorType === 'smog') {
          // Amber/hazey smog plume with soft radial gradient
          const radGrad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius);
          if (normalizedPsi > 200) {
            radGrad.addColorStop(0, `rgba(239, 68, 68, ${currentAlpha * 0.9})`);
            radGrad.addColorStop(0.6, `rgba(217, 119, 6, ${currentAlpha * 0.4})`);
            radGrad.addColorStop(1, 'rgba(180, 83, 9, 0)');
          } else {
            radGrad.addColorStop(0, `rgba(245, 158, 11, ${currentAlpha * 0.7})`);
            radGrad.addColorStop(0.5, `rgba(217, 119, 6, ${currentAlpha * 0.3})`);
            radGrad.addColorStop(1, 'rgba(217, 119, 6, 0)');
          }
          ctx.fillStyle = radGrad;
        } else {
          // Light clean air mote
          ctx.fillStyle = `rgba(226, 232, 240, ${currentAlpha * 0.6})`;
        }

        ctx.fill();
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isEnabled, normalizedPsi, intensityScale, targetParticleCount, windSpeed]);

  if (!isEnabled) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-20 overflow-hidden transition-opacity duration-1000"
      style={{ opacity: isEnabled ? 1 : 0 }}
      aria-hidden="true"
    >
      {/* Dynamic atmospheric color tint overlay */}
      <div
        className="absolute inset-0 transition-all duration-1000"
        style={{
          backgroundColor: ambientTint,
          opacity: Math.min(0.85, ambientWashOpacity),
          mixBlendMode: normalizedPsi > 120 ? 'multiply' : 'screen',
        }}
      />

      {/* CSS rolling fog cloud bank for intense haze */}
      {normalizedPsi > 90 && (
        <>
          <div
            className="absolute inset-x-0 top-0 h-96 opacity-40 blur-3xl transition-opacity duration-1000 animate-pulse pointer-events-none"
            style={{
              background:
                normalizedPsi > 200
                  ? 'radial-gradient(ellipse at 50% 0%, rgba(220, 80, 20, 0.35) 0%, rgba(180, 50, 10, 0.15) 50%, transparent 100%)'
                  : 'radial-gradient(ellipse at 50% 0%, rgba(217, 119, 6, 0.25) 0%, rgba(245, 158, 11, 0.1) 50%, transparent 100%)',
              animationDuration: '6s',
            }}
          />
          <div
            className="absolute inset-x-0 bottom-0 h-64 opacity-30 blur-2xl transition-opacity duration-1000 pointer-events-none"
            style={{
              background:
                normalizedPsi > 200
                  ? 'linear-gradient(to top, rgba(185, 28, 28, 0.25), transparent)'
                  : 'linear-gradient(to top, rgba(217, 119, 6, 0.18), transparent)',
            }}
          />
        </>
      )}

      {/* Particle Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full pointer-events-none" />
    </div>
  );
};
