import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../../../.env'), override: false });

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { initDb, dbAvailable, dbType } from './services/db.js';
import { runMigrations } from './services/migrations.js';
import { propertiesRouter } from './routes/properties.js';
import { financialsRouter } from './routes/financials.js';
import { expensesRouter } from './routes/expenses.js';
import { calculationsRouter } from './routes/calculations.js';
import { dashboardRouter } from './routes/dashboard.js';
import { documentsRouter } from './routes/documents.js';
import { lookupRouter } from './routes/lookup.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json({ limit: '10mb' }));

async function start() {
  await initDb();
  if (dbAvailable) {
    await runMigrations();
  }

  // API routes
  app.use('/api/properties', propertiesRouter);
  app.use('/api/properties', financialsRouter);
  app.use('/api/properties', expensesRouter);
  app.use('/api', calculationsRouter);
  app.use('/api', dashboardRouter);
  app.use('/api', documentsRouter);
  app.use('/api', lookupRouter);

  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      timestamp: Date.now(),
      database: dbAvailable,
      dbType: dbType,
    });
  });

  // Serve frontend in production
  const webDist = resolve(__dirname, '../../web/dist');
  app.use(express.static(webDist));
  app.get('*', (_req, res) => {
    res.sendFile(resolve(webDist, 'index.html'));
  });

  app.listen(PORT, () => {
    console.log(`[server] STR-Scout running on port ${PORT}`);
    console.log(`[server] Database: ${dbAvailable ? `${dbType} connected` : 'not available'}`);
  });
}

start().catch((err) => {
  console.error('[server] Failed to start:', err);
  process.exit(1);
});
