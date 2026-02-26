import { getDb, dbType } from './db.js';

export interface PropertyLookupResult {
  estimatedValue: number | null;
  taxAssessment: number | null;
  propertyType: string | null;
  unitCount: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  sqft: number | null;
  yearBuilt: number | null;
  lotSqft: number | null;
}

interface RentCastProperty {
  price?: number;
  estimatedValue?: number;
  lastSalePrice?: number;
  propertyType?: string;
  bedrooms?: number;
  bathrooms?: number;
  squareFootage?: number;
  yearBuilt?: number;
  lotSize?: number;
  features?: { unitCount?: number };
  taxAssessment?: number;
  tax?: number;
}

const RENTCAST_BASE = 'https://api.rentcast.io/v1/properties';

function mapPropertyType(rcType: string | undefined): string | null {
  if (!rcType) return null;
  const normalized = rcType.toLowerCase().replace(/[\s-]/g, '_');
  const map: Record<string, string> = {
    single_family: 'single_family',
    condo: 'condo',
    townhouse: 'townhouse',
    multi_family: 'multi_family',
    apartment: 'multi_family',
    duplex: 'multi_family',
    triplex: 'multi_family',
    cabin: 'cabin',
  };
  return map[normalized] || 'other';
}

function extractResult(data: RentCastProperty): PropertyLookupResult {
  return {
    estimatedValue: data.estimatedValue ?? data.lastSalePrice ?? data.price ?? null,
    taxAssessment: data.taxAssessment ?? data.tax ?? null,
    propertyType: mapPropertyType(data.propertyType),
    unitCount: data.features?.unitCount ?? null,
    bedrooms: data.bedrooms ?? null,
    bathrooms: data.bathrooms ?? null,
    sqft: data.squareFootage ?? null,
    yearBuilt: data.yearBuilt ?? null,
    lotSqft: data.lotSize ?? null,
  };
}

async function checkCache(address: string): Promise<{ raw: string; result: PropertyLookupResult } | null> {
  const db = getDb();
  if (!db) return null;

  const isSqlite = dbType === 'sqlite';
  const { rows } = await db.query(
    isSqlite
      ? 'SELECT * FROM property_lookups WHERE LOWER(address) = LOWER(?) LIMIT 1'
      : 'SELECT * FROM property_lookups WHERE LOWER(address) = LOWER($1) LIMIT 1',
    [address],
  );

  if (rows.length === 0) return null;

  const row = rows[0];
  return {
    raw: row.raw_response,
    result: {
      estimatedValue: row.estimated_value,
      taxAssessment: row.tax_assessment,
      propertyType: row.property_type,
      unitCount: row.unit_count,
      bedrooms: row.bedrooms,
      bathrooms: row.bathrooms,
      sqft: row.sqft,
      yearBuilt: row.year_built,
      lotSqft: row.lot_sqft,
    },
  };
}

async function saveToCache(
  address: string, city: string | null, state: string | null, zip: string | null,
  rawJson: string, result: PropertyLookupResult,
): Promise<void> {
  const db = getDb();
  if (!db) return;

  await db.query(
    `INSERT INTO property_lookups
       (address, city, state, zip, raw_response, estimated_value, tax_assessment, property_type, unit_count, bedrooms, bathrooms, sqft, year_built, lot_sqft)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
    [
      address, city, state, zip, rawJson,
      result.estimatedValue, result.taxAssessment, result.propertyType, result.unitCount,
      result.bedrooms, result.bathrooms, result.sqft, result.yearBuilt, result.lotSqft,
    ],
  );
}

export async function lookupProperty(
  address: string, city?: string, state?: string, zip?: string,
): Promise<{ result: PropertyLookupResult; cached: boolean } | null> {
  // Check cache first
  const cached = await checkCache(address);
  if (cached) {
    console.log('[lookup] Cache hit for:', address);
    return { result: cached.result, cached: true };
  }

  // No API key → skip silently
  const apiKey = process.env.RENTCAST_API_KEY;
  if (!apiKey) {
    console.log('[lookup] No RENTCAST_API_KEY set, skipping lookup');
    return null;
  }

  // Build query string
  const params = new URLSearchParams();
  params.set('address', address);
  if (city) params.set('city', city);
  if (state) params.set('state', state);
  if (zip) params.set('zipCode', zip);

  try {
    const url = `${RENTCAST_BASE}?${params.toString()}`;
    console.log('[lookup] Calling RentCast for:', address);

    const res = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'X-Api-Key': apiKey,
      },
    });

    if (!res.ok) {
      console.error(`[lookup] RentCast error: ${res.status} ${res.statusText}`);
      return null;
    }

    const data = await res.json();

    // RentCast returns an array; take the first match
    const property: RentCastProperty | undefined = Array.isArray(data) ? data[0] : data;
    if (!property) {
      console.log('[lookup] No results from RentCast for:', address);
      return null;
    }

    const rawJson = JSON.stringify(property);
    const result = extractResult(property);

    // Cache for future use
    await saveToCache(address, city || null, state || null, zip || null, rawJson, result);

    return { result, cached: false };
  } catch (err) {
    console.error('[lookup] Failed to call RentCast:', err);
    return null;
  }
}
