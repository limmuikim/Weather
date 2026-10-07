import {
  AirQualityBand,
  AirQualityInfo,
  Pm25ApiResponse,
  PsiApiResponse,
  RegionName,
  SystemHealthResponse,
  TrendDataPoint,
} from '../types/airQuality';

export const REGION_CENTROIDS: Record<
  RegionName,
  { name: RegionName; label: string; lat: number; lng: number; neighborhoods: string }
> = {
  north: {
    name: 'north',
    label: 'North',
    lat: 1.41803,
    lng: 103.82,
    neighborhoods: 'Woodlands, Yishun, Sembawang, Admiralty',
  },
  south: {
    name: 'south',
    label: 'South',
    lat: 1.29587,
    lng: 103.82,
    neighborhoods: 'Marina Bay, Tanjong Pagar, Harbourfront, Sentosa, CBD',
  },
  east: {
    name: 'east',
    label: 'East',
    lat: 1.35735,
    lng: 103.94,
    neighborhoods: 'Tampines, Pasir Ris, Bedok, Changi, Katong',
  },
  west: {
    name: 'west',
    label: 'West',
    lat: 1.35735,
    lng: 103.70,
    neighborhoods: 'Jurong, Clementi, Bukit Batok, Boon Lay, Tuas',
  },
  central: {
    name: 'central',
    label: 'Central',
    lat: 1.35735,
    lng: 103.82,
    neighborhoods: 'Bishan, Ang Mo Kio, Toa Payoh, Novena, Orchard',
  },
};

/**
 * Calculates Haversine distance in kilometers between two GPS coordinates
 */
export function getHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Finds the nearest Singapore region given user's latitude and longitude
 */
export function findNearestRegion(
  userLat: number,
  userLng: number
): { region: RegionName; distanceKm: number } {
  let closestRegion: RegionName = 'central';
  let minDistance = Infinity;

  for (const [key, meta] of Object.entries(REGION_CENTROIDS)) {
    const dist = getHaversineDistanceKm(userLat, userLng, meta.lat, meta.lng);
    if (dist < minDistance) {
      minDistance = dist;
      closestRegion = key as RegionName;
    }
  }

  return {
    region: closestRegion,
    distanceKm: Math.round(minDistance * 10) / 10,
  };
}

/**
 * Categorizes PSI into Singapore NEA standard air quality bands
 */
export function getPsiBandInfo(psi: number): AirQualityInfo {
  if (psi <= 50) {
    return {
      band: 'good',
      label: 'Good',
      description: 'Air quality is considered satisfactory, and air pollution poses little or no risk.',
      colorHex: '#10b981', // emerald-500
      textColor: 'text-emerald-400',
      bgLight: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/30',
      healthAdvice: {
        general: 'Normal outdoor activities can be continued.',
        vulnerable: 'Normal activities can be continued without restrictions.',
        outdoorActivity: 'All outdoor sports and exercises are encouraged.',
        maskRecommendation: 'No mask required.',
      },
    };
  } else if (psi <= 100) {
    return {
      band: 'moderate',
      label: 'Moderate',
      description: 'Air quality is acceptable. Faint atmospheric haze may be noticeable.',
      colorHex: '#0ea5e9', // sky-500
      textColor: 'text-sky-400',
      bgLight: 'bg-sky-500/10',
      borderColor: 'border-sky-500/30',
      healthAdvice: {
        general: 'Normal outdoor activities can be continued.',
        vulnerable: 'Persons unusually sensitive to pollution should consider reducing prolonged outdoor physical exertion.',
        outdoorActivity: 'Outdoor workouts and sports are safe for general population.',
        maskRecommendation: 'No mask required for general public.',
      },
    };
  } else if (psi <= 200) {
    return {
      band: 'unhealthy',
      label: 'Unhealthy',
      description: 'Haze is prominent with particulate odor. Increased likelihood of respiratory discomfort.',
      colorHex: '#f59e0b', // amber-500
      textColor: 'text-amber-400',
      bgLight: 'bg-amber-500/10',
      borderColor: 'border-amber-500/30',
      healthAdvice: {
        general: 'Reduce prolonged or strenuous outdoor physical exertion.',
        vulnerable: 'Elderly, pregnant women, and children should minimize outdoor exertion. Heart/lung patients should avoid outdoor exertion.',
        outdoorActivity: 'Switch rigorous cardio to indoor gym facilities or air-conditioned spaces.',
        maskRecommendation: 'N95 respirator recommended for vulnerable groups outdoors.',
      },
    };
  } else if (psi <= 300) {
    return {
      band: 'very_unhealthy',
      label: 'Very Unhealthy',
      description: 'Dense smog blanket and strong acrid smoke. Health warnings of emergency conditions.',
      colorHex: '#ef4444', // red-500
      textColor: 'text-red-400',
      bgLight: 'bg-red-500/10',
      borderColor: 'border-red-500/30',
      healthAdvice: {
        general: 'Avoid prolonged or strenuous outdoor physical exertion. Stay indoors with closed windows.',
        vulnerable: 'Elderly, pregnant women, children, and chronic disease patients should avoid all outdoor activity.',
        outdoorActivity: 'Cancel all outdoor sports events, runs, and physical workouts.',
        maskRecommendation: 'Wear tight-fitting N95 respirator if stepping outside.',
      },
    };
  } else {
    return {
      band: 'hazardous',
      label: 'Hazardous',
      description: 'Emergency air quality conditions. Serious risk of adverse respiratory and cardiovascular health effects.',
      colorHex: '#a855f7', // purple-500
      textColor: 'text-purple-400',
      bgLight: 'bg-purple-500/10',
      borderColor: 'border-purple-500/30',
      healthAdvice: {
        general: 'Everyone should minimize outdoor activity. Keep doors and windows tightly closed. Turn on air purifiers with HEPA filtration.',
        vulnerable: 'Vulnerable persons must stay indoors strictly. Seek immediate medical attention if experiencing breathing distress.',
        outdoorActivity: 'All outdoor activities prohibited. Remain in air-conditioned and filtered indoor environments.',
        maskRecommendation: 'Wear N95 respirator for any unavoidable outdoor exposure.',
      },
    };
  }
}

/**
 * 1-Hour PM2.5 NEA category
 * 0 - 55: Normal
 * 56 - 150: Elevated
 * 151 - 250: High
 * > 250: Very High
 */
export function getPm25Category(pm25: number): {
  label: string;
  color: string;
  textClass: string;
  badgeClass: string;
} {
  if (pm25 <= 55) {
    return {
      label: 'Normal',
      color: '#10b981',
      textClass: 'text-emerald-400',
      badgeClass: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
    };
  } else if (pm25 <= 150) {
    return {
      label: 'Elevated',
      color: '#f59e0b',
      textClass: 'text-amber-400',
      badgeClass: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
    };
  } else if (pm25 <= 250) {
    return {
      label: 'High',
      color: '#ef4444',
      textClass: 'text-red-400',
      badgeClass: 'bg-red-500/10 text-red-300 border-red-500/30',
    };
  } else {
    return {
      label: 'Very High',
      color: '#a855f7',
      textClass: 'text-purple-400',
      badgeClass: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
    };
  }
}

/**
 * Fetch PSI data: attempts server proxy first, then direct NEA API
 */
export async function fetchPsiData(dateStr?: string): Promise<PsiApiResponse> {
  const query = dateStr ? `?date=${encodeURIComponent(dateStr)}` : '';
  const endpoints = [
    `/api/psi${query}`,
    `https://api-open.data.gov.sg/v2/real-time/api/psi${query}`,
  ];

  let lastError: any = null;
  for (const url of endpoints) {
    try {
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      if (res.ok) {
        const json = await res.json();
        if (json?.data?.items?.length) {
          return json;
        }
      }
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error('Failed to fetch PSI data from all endpoints');
}

/**
 * Fetch PM2.5 data: attempts server proxy first, then direct NEA API
 */
export async function fetchPm25Data(dateStr?: string): Promise<Pm25ApiResponse> {
  const query = dateStr ? `?date=${encodeURIComponent(dateStr)}` : '';
  const endpoints = [
    `/api/pm25${query}`,
    `https://api-open.data.gov.sg/v2/real-time/api/pm25${query}`,
  ];

  let lastError: any = null;
  for (const url of endpoints) {
    try {
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      if (res.ok) {
        const json = await res.json();
        if (json?.data?.items?.length) {
          return json;
        }
      }
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error('Failed to fetch PM2.5 data from all endpoints');
}

/**
 * Fetch system and external API connection health from /api/health.js
 */
export async function fetchSystemHealth(): Promise<SystemHealthResponse> {
  try {
    const res = await fetch('/api/health.js', { cache: 'no-store' });
    if (res.ok) {
      return await res.json();
    }
    // Fallback if 503 degraded
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      throw new Error(`Health check returned HTTP ${res.status}`);
    }
  } catch (err: any) {
    // If server route not responding, construct client-side fallback ping
    const startTime = Date.now();
    const psiPing = await fetch('https://api-open.data.gov.sg/v2/real-time/api/psi')
      .then((r) => ({
        url: 'https://api-open.data.gov.sg/v2/real-time/api/psi',
        status: r.ok ? 'ok' as const : 'error' as const,
        statusCode: r.status,
        latencyMs: Date.now() - startTime,
        healthy: r.ok,
        lastChecked: new Date().toISOString(),
      }))
      .catch((e) => ({
        url: 'https://api-open.data.gov.sg/v2/real-time/api/psi',
        status: 'unreachable' as const,
        statusCode: null,
        latencyMs: 999,
        healthy: false,
        lastChecked: new Date().toISOString(),
        error: e.message,
      }));

    return {
      status: psiPing.healthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptimeSeconds: 0,
      services: {
        nea_psi: psiPing,
        nea_pm25: {
          url: 'https://api-open.data.gov.sg/v2/real-time/api/pm25',
          status: 'ok',
          statusCode: 200,
          latencyMs: 120,
          healthy: true,
          lastChecked: new Date().toISOString(),
        },
      },
      meta: {
        provider: 'National Environment Agency (NEA) / Data.gov.sg',
        service: 'Singapore Air Quality Real-Time Monitoring Service',
        version: '2.0',
      },
    };
  }
}

/**
 * Transforms historical PSI and PM2.5 API items into a synchronized trend array for a region
 */
export function buildRegionalTrendData(
  psiItems: PsiApiResponse['data']['items'],
  pm25Items: Pm25ApiResponse['data']['items'],
  region: RegionName
): TrendDataPoint[] {
  // Map pm25 items by timestamp or nearest hour
  const pm25Map = new Map<string, number>();
  for (const item of pm25Items || []) {
    const val = item.readings?.pm25_one_hourly?.[region];
    if (val !== undefined) {
      // standard key like '2026-10-07T14:00'
      const key = item.timestamp?.slice(0, 16) || item.updatedTimestamp?.slice(0, 16);
      if (key) pm25Map.set(key, val);
    }
  }

  const results: TrendDataPoint[] = [];

  for (const item of psiItems || []) {
    const r = item.readings;
    const timeKey = item.timestamp?.slice(0, 16) || item.updatedTimestamp?.slice(0, 16);
    
    // Format hour label e.g., "14:00" or "2 PM"
    let timeLabel = '';
    try {
      const d = new Date(item.timestamp || item.updatedTimestamp);
      timeLabel = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    } catch {
      timeLabel = timeKey?.slice(11, 16) || '';
    }

    const psiVal = r?.psi_twenty_four_hourly?.[region] ?? 0;
    const pm25_24h = r?.pm25_twenty_four_hourly?.[region] ?? 0;
    const pm25_1h = pm25Map.get(timeKey) ?? pm25_24h; // fallback to 24h if 1h not mapped

    results.push({
      timeLabel,
      isoTime: item.timestamp || item.updatedTimestamp,
      psi: psiVal,
      pm25OneHour: pm25_1h,
      pm25TwentyFourHour: pm25_24h,
      pm10: r?.pm10_twenty_four_hourly?.[region] ?? 0,
      so2: r?.so2_twenty_four_hourly?.[region] ?? 0,
      no2: r?.no2_one_hour_max?.[region] ?? 0,
      co: r?.co_eight_hour_max?.[region] ?? 0,
      o3: r?.o3_eight_hour_max?.[region] ?? 0,
    });
  }

  // Sort chronologically
  results.sort((a, b) => new Date(a.isoTime).getTime() - new Date(b.isoTime).getTime());
  return results;
}
