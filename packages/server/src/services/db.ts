import pg from 'pg';

const { Pool } = pg;

let pool: pg.Pool | null = null;
export let dbAvailable = false;

export async function initDb(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.log('[db] DATABASE_URL not set — running without database');
    return;
  }

  try {
    pool = new Pool({ connectionString: url, max: 10 });
    await pool.query('SELECT 1');
    dbAvailable = true;
    console.log('[db] PostgreSQL connected');
  } catch (err) {
    console.error('[db] Failed to connect to PostgreSQL:', err);
    pool = null;
    dbAvailable = false;
  }
}

export function getPool(): pg.Pool | null {
  return pool;
}
