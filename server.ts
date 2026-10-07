import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
// @ts-ignore
import healthHandler, { getSystemHealth } from './api/health.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Cache for NEA responses to reduce latency and prevent external rate-limits
interface CacheEntry {
  data: any;
  timestamp: number;
}
const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 30 * 1000; // 30 seconds cache

app.use(express.json());

// Enable CORS for API routes
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// Health check endpoints requested by user specification
app.get('/api/health.js', healthHandler);
app.get('/api/health', healthHandler);

// Proxy for NEA PSI API
app.get('/api/psi', async (req, res) => {
  try {
    const date = req.query.date as string | undefined;
    const cacheKey = `psi:${date || 'latest'}`;
    const cached = cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      res.setHeader('X-Cache', 'HIT');
      return res.json(cached.data);
    }

    const url = date
      ? `https://api-open.data.gov.sg/v2/real-time/api/psi?date=${encodeURIComponent(date)}`
      : 'https://api-open.data.gov.sg/v2/real-time/api/psi';

    const upstreamRes = await fetch(url, {
      headers: { 'Accept': 'application/json' },
    });

    if (!upstreamRes.ok) {
      return res.status(upstreamRes.status).json({
        code: upstreamRes.status,
        errorMsg: `Upstream NEA error: ${upstreamRes.statusText}`,
      });
    }

    const data = await upstreamRes.json();
    cache.set(cacheKey, { data, timestamp: Date.now() });
    res.setHeader('X-Cache', 'MISS');
    res.json(data);
  } catch (err: any) {
    res.status(502).json({
      code: 502,
      errorMsg: err?.message || 'Failed to fetch PSI data from NEA',
    });
  }
});

// Proxy for NEA PM2.5 API
app.get('/api/pm25', async (req, res) => {
  try {
    const date = req.query.date as string | undefined;
    const cacheKey = `pm25:${date || 'latest'}`;
    const cached = cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      res.setHeader('X-Cache', 'HIT');
      return res.json(cached.data);
    }

    const url = date
      ? `https://api-open.data.gov.sg/v2/real-time/api/pm25?date=${encodeURIComponent(date)}`
      : 'https://api-open.data.gov.sg/v2/real-time/api/pm25';

    const upstreamRes = await fetch(url, {
      headers: { 'Accept': 'application/json' },
    });

    if (!upstreamRes.ok) {
      return res.status(upstreamRes.status).json({
        code: upstreamRes.status,
        errorMsg: `Upstream NEA error: ${upstreamRes.statusText}`,
      });
    }

    const data = await upstreamRes.json();
    cache.set(cacheKey, { data, timestamp: Date.now() });
    res.setHeader('X-Cache', 'MISS');
    res.json(data);
  } catch (err: any) {
    res.status(502).json({
      code: 502,
      errorMsg: err?.message || 'Failed to fetch PM2.5 data from NEA',
    });
  }
});

async function startServer() {
  if (!isProduction) {
    // In dev mode, mount Vite middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // In production mode, serve built static files from dist
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist/index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SG Air Quality Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
