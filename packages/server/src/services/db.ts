import pg from 'pg';
import Database from 'better-sqlite3';
import { mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Unified query result matching pg's interface */
export interface QueryResult {
  rows: any[];
  rowCount: number;
}

/** Minimal DB client interface — both pg and SQLite implement this */
export interface DbClient {
  query(sql: string, params?: any[]): Promise<QueryResult>;
}

// --------------- PostgreSQL adapter ---------------

class PgClient implements DbClient {
  private pool: pg.Pool;

  constructor(url: string) {
    this.pool = new pg.Pool({ connectionString: url, max: 10 });
  }

  async connect(): Promise<void> {
    await this.pool.query('SELECT 1');
  }

  async query(sql: string, params?: any[]): Promise<QueryResult> {
    const result = await this.pool.query(sql, params);
    return { rows: result.rows, rowCount: result.rowCount ?? 0 };
  }
}

// --------------- SQLite adapter ---------------

class SqliteClient implements DbClient {
  private db: Database.Database;

  constructor(filePath: string) {
    mkdirSync(dirname(filePath), { recursive: true });
    this.db = new Database(filePath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
  }

  async query(sql: string, params?: any[]): Promise<QueryResult> {
    const translated = this.translateSQL(sql);
    const safeParams = (params || []).map((p) =>
      p === true ? 1 : p === false ? 0 : p,
    );

    const isSelect = /^\s*SELECT/i.test(translated);
    const hasReturning = /\bRETURNING\b/i.test(translated);

    if (isSelect || hasReturning) {
      const stmt = this.db.prepare(translated);
      const rows = stmt.all(...safeParams);
      return { rows, rowCount: rows.length };
    } else {
      const stmt = this.db.prepare(translated);
      const result = stmt.run(...safeParams);
      return { rows: [], rowCount: result.changes };
    }
  }

  private translateSQL(sql: string): string {
    return sql
      .replace(/\$(\d+)/g, '?')       // $1, $2, ... → ?
      .replace(/\bNOW\(\)/gi, "datetime('now')");  // NOW() → datetime('now')
  }
}

// --------------- Shared state ---------------

let client: DbClient | null = null;
export let dbAvailable = false;
export let dbType: 'postgres' | 'sqlite' | null = null;

export async function initDb(): Promise<void> {
  const url = process.env.DATABASE_URL;

  if (url) {
    // Production / remote: PostgreSQL
    try {
      const pgClient = new PgClient(url);
      await pgClient.connect();
      client = pgClient;
      dbAvailable = true;
      dbType = 'postgres';
      console.log('[db] PostgreSQL connected');
    } catch (err) {
      console.error('[db] Failed to connect to PostgreSQL:', err);
    }
  } else {
    // Local dev: SQLite
    const sqlitePath = process.env.SQLITE_PATH
      || resolve(__dirname, '../../../../data/str-scout.db');

    try {
      client = new SqliteClient(sqlitePath);
      dbAvailable = true;
      dbType = 'sqlite';
      console.log(`[db] SQLite opened at ${sqlitePath}`);
    } catch (err) {
      console.error('[db] Failed to open SQLite:', err);
    }
  }
}

export function getDb(): DbClient | null {
  return client;
}
