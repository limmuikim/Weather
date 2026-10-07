/**
 * Health check handler and service availability monitor
 * Checks external NEA PSI and PM2.5 API connections
 */

const NEA_PSI_URL = 'https://api-open.data.gov.sg/v2/real-time/api/psi';
const NEA_PM25_URL = 'https://api-open.data.gov.sg/v2/real-time/api/pm25';

export async function checkEndpoint(url, timeoutMs = 6000) {
  const startTime = Date.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'SGAirQualityMonitor/1.0',
      },
    });
    clearTimeout(timeoutId);
    const latencyMs = Date.now() - startTime;

    if (!res.ok) {
      return {
        url,
        status: 'error',
        statusCode: res.status,
        statusText: res.statusText,
        latencyMs,
        healthy: false,
        lastChecked: new Date().toISOString(),
        error: `HTTP ${res.status}: ${res.statusText}`,
      };
    }

    const data = await res.json();
    const items = data?.data?.items || [];
    const regionMetadata = data?.data?.regionMetadata || [];
    const latestItem = items[items.length - 1] || null;

    return {
      url,
      status: 'ok',
      statusCode: res.status,
      latencyMs,
      healthy: true,
      lastChecked: new Date().toISOString(),
      updatedTimestamp: latestItem?.updatedTimestamp || latestItem?.timestamp || null,
      regionsFound: regionMetadata.map((r) => r.name),
      recordCount: items.length,
    };
  } catch (err) {
    clearTimeout(timeoutId);
    const latencyMs = Date.now() - startTime;
    return {
      url,
      status: 'unreachable',
      statusCode: null,
      latencyMs,
      healthy: false,
      lastChecked: new Date().toISOString(),
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function getSystemHealth() {
  const [psiResult, pm25Result] = await Promise.all([
    checkEndpoint(NEA_PSI_URL),
    checkEndpoint(NEA_PM25_URL),
  ]);

  const bothHealthy = psiResult.healthy && pm25Result.healthy;
  const partialHealthy = psiResult.healthy || pm25Result.healthy;

  const status = bothHealthy ? 'healthy' : partialHealthy ? 'degraded' : 'unhealthy';

  return {
    status,
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime ? process.uptime() : 0),
    services: {
      nea_psi: psiResult,
      nea_pm25: pm25Result,
    },
    meta: {
      provider: 'National Environment Agency (NEA) / Data.gov.sg',
      service: 'Singapore Air Quality Real-Time Monitoring Service',
      version: '2.0',
    },
  };
}

// Express route handler
export default async function healthHandler(req, res) {
  try {
    const health = await getSystemHealth();
    const httpStatus = health.status === 'unhealthy' ? 503 : 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.status(httpStatus).json(health);
  } catch (err) {
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: err instanceof Error ? err.message : 'Internal error during health check',
    });
  }
}

// CLI check support if run directly via `node api/health.js`
if (process.argv[1] && process.argv[1].endsWith('health.js')) {
  getSystemHealth().then((health) => {
    console.log(JSON.stringify(health, null, 2));
    if (health.status === 'unhealthy') process.exit(1);
  });
}
