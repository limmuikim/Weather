export type RegionName = 'north' | 'south' | 'east' | 'west' | 'central';

export interface RegionMetadata {
  name: RegionName;
  labelLocation: {
    latitude: number;
    longitude: number;
  };
}

export interface PsiReadings {
  psi_twenty_four_hourly?: Record<RegionName, number>;
  pm25_twenty_four_hourly?: Record<RegionName, number>;
  pm10_twenty_four_hourly?: Record<RegionName, number>;
  so2_twenty_four_hourly?: Record<RegionName, number>;
  no2_one_hour_max?: Record<RegionName, number>;
  co_eight_hour_max?: Record<RegionName, number>;
  o3_eight_hour_max?: Record<RegionName, number>;
  pm25_sub_index?: Record<RegionName, number>;
  pm10_sub_index?: Record<RegionName, number>;
  so2_sub_index?: Record<RegionName, number>;
  co_sub_index?: Record<RegionName, number>;
  o3_sub_index?: Record<RegionName, number>;
}

export interface PsiItem {
  date: string;
  timestamp: string;
  updatedTimestamp: string;
  readings: PsiReadings;
}

export interface PsiApiResponse {
  code: number;
  data: {
    regionMetadata: RegionMetadata[];
    items: PsiItem[];
  };
  errorMsg?: string;
}

export interface Pm25Readings {
  pm25_one_hourly: Record<RegionName, number>;
}

export interface Pm25Item {
  date: string;
  timestamp: string;
  updatedTimestamp: string;
  readings: Pm25Readings;
}

export interface Pm25ApiResponse {
  code: number;
  data: {
    regionMetadata: RegionMetadata[];
    items: Pm25Item[];
  };
  errorMsg?: string;
}

export interface ApiEndpointHealth {
  url: string;
  status: 'ok' | 'error' | 'unreachable';
  statusCode: number | null;
  latencyMs: number;
  healthy: boolean;
  lastChecked: string;
  updatedTimestamp?: string | null;
  regionsFound?: string[];
  recordCount?: number;
  error?: string;
}

export interface SystemHealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptimeSeconds: number;
  services: {
    nea_psi: ApiEndpointHealth;
    nea_pm25: ApiEndpointHealth;
  };
  meta: {
    provider: string;
    service: string;
    version: string;
  };
}

export type AirQualityBand = 'good' | 'moderate' | 'unhealthy' | 'very_unhealthy' | 'hazardous';

export interface AirQualityInfo {
  band: AirQualityBand;
  label: string;
  description: string;
  colorHex: string;
  textColor: string;
  bgLight: string;
  borderColor: string;
  healthAdvice: {
    general: string;
    vulnerable: string; // Elderly, pregnant, kids, lung/heart conditions
    outdoorActivity: string;
    maskRecommendation: string;
  };
}

export interface TrendDataPoint {
  timeLabel: string;
  isoTime: string;
  psi: number;
  pm25OneHour: number;
  pm25TwentyFourHour: number;
  pm10: number;
  so2: number;
  no2: number;
  co: number;
  o3: number;
}
