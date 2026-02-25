import { getPool } from './db.js';

interface Migration {
  name: string;
  sql: string;
}

const migrations: Migration[] = [
  {
    name: '001_create_properties',
    sql: `
      CREATE TABLE IF NOT EXISTS properties (
        id            SERIAL PRIMARY KEY,
        name          TEXT NOT NULL,
        address       TEXT,
        city          TEXT,
        state         TEXT,
        zip           TEXT,
        property_type TEXT NOT NULL DEFAULT 'single_family',
        unit_count    INTEGER NOT NULL DEFAULT 1,
        status        TEXT NOT NULL DEFAULT 'analyzing',
        notes         TEXT,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `,
  },
  {
    name: '002_create_acquisition_costs',
    sql: `
      CREATE TABLE IF NOT EXISTS acquisition_costs (
        id              SERIAL PRIMARY KEY,
        property_id     INTEGER NOT NULL UNIQUE REFERENCES properties(id) ON DELETE CASCADE,
        purchase_price  NUMERIC(12,2) NOT NULL DEFAULT 0,
        closing_costs   NUMERIC(12,2) NOT NULL DEFAULT 0,
        renovation      NUMERIC(12,2) NOT NULL DEFAULT 0,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `,
  },
  {
    name: '003_create_financing',
    sql: `
      CREATE TABLE IF NOT EXISTS financing (
        id                SERIAL PRIMARY KEY,
        property_id       INTEGER NOT NULL UNIQUE REFERENCES properties(id) ON DELETE CASCADE,
        down_payment_pct  NUMERIC(5,2) NOT NULL DEFAULT 20,
        interest_rate     NUMERIC(5,3) NOT NULL DEFAULT 7,
        loan_term_years   INTEGER NOT NULL DEFAULT 30,
        is_cash_purchase  BOOLEAN NOT NULL DEFAULT false,
        created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `,
  },
  {
    name: '004_create_rental_income',
    sql: `
      CREATE TABLE IF NOT EXISTS rental_income (
        id                SERIAL PRIMARY KEY,
        property_id       INTEGER NOT NULL UNIQUE REFERENCES properties(id) ON DELETE CASCADE,
        nightly_rate      NUMERIC(10,2) NOT NULL DEFAULT 0,
        occupancy_pct     NUMERIC(5,2) NOT NULL DEFAULT 65,
        avg_stay_nights   NUMERIC(4,1) NOT NULL DEFAULT 3,
        created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `,
  },
  {
    name: '005_create_operating_expenses',
    sql: `
      CREATE TABLE IF NOT EXISTS operating_expenses (
        id              SERIAL PRIMARY KEY,
        property_id     INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
        category        TEXT NOT NULL,
        label           TEXT NOT NULL,
        amount          NUMERIC(10,2) NOT NULL DEFAULT 0,
        frequency       TEXT NOT NULL DEFAULT 'monthly',
        is_percentage   BOOLEAN NOT NULL DEFAULT false,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `,
  },
  {
    name: '006_create_documents',
    sql: `
      CREATE TABLE IF NOT EXISTS documents (
        id            SERIAL PRIMARY KEY,
        property_id   INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
        filename      TEXT NOT NULL,
        original_name TEXT NOT NULL,
        mime_type     TEXT NOT NULL,
        size_bytes    INTEGER NOT NULL,
        storage_path  TEXT NOT NULL,
        uploaded_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `,
  },
  {
    name: '007_create_extracted_data',
    sql: `
      CREATE TABLE IF NOT EXISTS extracted_data (
        id            SERIAL PRIMARY KEY,
        document_id   INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
        property_id   INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
        field_name    TEXT NOT NULL,
        field_value   TEXT NOT NULL,
        confidence    NUMERIC(3,2) NOT NULL DEFAULT 0,
        label         TEXT,
        status        TEXT NOT NULL DEFAULT 'pending',
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `,
  },
];

export async function runMigrations(): Promise<void> {
  const pool = getPool();
  if (!pool) return;

  // Create migrations tracking table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      name       TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  // Get already-applied migrations
  const { rows } = await pool.query('SELECT name FROM migrations');
  const applied = new Set(rows.map((r: { name: string }) => r.name));

  for (const migration of migrations) {
    if (applied.has(migration.name)) continue;
    console.log(`[migrations] Applying ${migration.name}...`);
    await pool.query(migration.sql);
    await pool.query('INSERT INTO migrations (name) VALUES ($1)', [migration.name]);
  }

  console.log('[migrations] All migrations applied');
}
