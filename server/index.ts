import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

import authRoutes  from './routes/auth.js';
import tradeRoutes from './routes/trades.js';
import statsRoutes from './routes/stats.js';
import miscRoutes  from './routes/misc.js';

config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === 'production';

app.use(cors({
  origin: isProd ? false : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}));
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser() as express.RequestHandler);

app.use('/api/auth',   authRoutes);
app.use('/api/trades', tradeRoutes);
app.use('/api/stats',  statsRoutes);
app.use('/api',        miscRoutes);

app.get('/api/health', (_: Request, res: Response) => res.json({ ok: true, ts: new Date().toISOString() }));

if (isProd) {
  const distPath = join(__dirname, '../../client/dist');
  if (existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get('*', (_: Request, res: Response) => res.sendFile(join(distPath, 'index.html')));
  }
}

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🚀 SMC Journal server running on port ${PORT}`);
  console.log(`   ENV: ${process.env.NODE_ENV || 'development'}`);
});
