import { Router } from 'express';
import { dbAvailable } from '../services/db.js';
import { lookupProperty } from '../services/propertyLookup.js';

export const lookupRouter = Router();

// GET /api/lookup?address=...&city=...&state=...&zip=...
lookupRouter.get('/lookup', async (req, res) => {
  if (!dbAvailable) return res.status(503).json({ error: 'Database not available' });

  const { address, city, state, zip } = req.query;
  if (!address || typeof address !== 'string') {
    return res.status(400).json({ error: 'address query parameter is required' });
  }

  const lookup = await lookupProperty(
    address,
    typeof city === 'string' ? city : undefined,
    typeof state === 'string' ? state : undefined,
    typeof zip === 'string' ? zip : undefined,
  );

  if (!lookup) {
    return res.json({ found: false, data: null });
  }

  const { result, cached } = lookup;

  // Derive insurance estimate: ~0.5% of property value annually
  const insuranceEstimate = result.estimatedValue
    ? Math.round(result.estimatedValue * 0.005)
    : null;

  res.json({
    found: true,
    cached,
    data: {
      ...result,
      insuranceEstimate,
    },
  });
});
