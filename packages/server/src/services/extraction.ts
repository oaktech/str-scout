import Anthropic from '@anthropic-ai/sdk';
import { readFile } from 'fs/promises';
import { getAbsolutePath } from './fileStorage.js';

interface ExtractedField {
  field_name: string;
  field_value: string;
  confidence: number;
  label: string;
}

const EXTRACTION_PROMPT = `You are analyzing a real estate property document (listing, financial statement, or property report).
Extract all relevant financial and property data you can find. Return a JSON array of objects with these fields:
- field_name: one of: purchase_price, closing_costs, renovation, nightly_rate, occupancy_pct, avg_stay_nights, down_payment_pct, interest_rate, loan_term_years, property_type, unit_count, address, city, state, zip, expense_* (for expenses, use expense_insurance, expense_property_tax, expense_utilities, expense_management, expense_cleaning, expense_maintenance, expense_hoa, expense_supplies, expense_other)
- field_value: the extracted value as a string (numbers without $ or % symbols)
- confidence: 0.0 to 1.0 indicating your confidence in the extraction
- label: a human-readable description of what was extracted

For expenses, also include:
- frequency: "monthly" or "annual"

Return ONLY the JSON array, no other text.`;

export async function extractFromImage(storagePath: string): Promise<ExtractedField[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured');

  const absolutePath = getAbsolutePath(storagePath);
  const fileData = await readFile(absolutePath);
  const base64 = fileData.toString('base64');

  const ext = storagePath.split('.').pop()?.toLowerCase();
  const mediaType = ext === 'png' ? 'image/png'
    : ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg'
    : ext === 'webp' ? 'image/webp'
    : 'image/png';

  const client = new Anthropic({ apiKey });
  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mediaType, data: base64 },
          },
          { type: 'text', text: EXTRACTION_PROMPT },
        ],
      },
    ],
  });

  return parseResponse(response);
}

export async function extractFromText(text: string): Promise<ExtractedField[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured');

  const client = new Anthropic({ apiKey });
  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: `Here is the text content of a real estate property document:\n\n${text}\n\n${EXTRACTION_PROMPT}`,
      },
    ],
  });

  return parseResponse(response);
}

function parseResponse(response: Anthropic.Message): ExtractedField[] {
  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('');

  // Extract JSON array from response (may be wrapped in markdown code block)
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return [];

  try {
    return JSON.parse(jsonMatch[0]);
  } catch {
    return [];
  }
}
