import { Router } from 'express';
import { dbAvailable } from '../services/db.js';
import { calculate } from '../services/calculations.js';
import { getPropertyFinancials } from '../services/propertyData.js';

export const calculationsRouter = Router();

// GET /api/properties/:id/calculations
calculationsRouter.get('/properties/:id/calculations', async (req, res) => {
  if (!dbAvailable) return res.status(503).json({ error: 'Database not available' });

  const input = await getPropertyFinancials(parseInt(req.params.id));
  if (!input) return res.status(404).json({ error: 'Property not found' });

  const result = calculate(input);
  res.json(result);
});

// POST /api/compare — compare multiple properties
calculationsRouter.post('/compare', async (req, res) => {
  if (!dbAvailable) return res.status(503).json({ error: 'Database not available' });

  const { propertyIds } = req.body;
  if (!Array.isArray(propertyIds) || propertyIds.length === 0) {
    return res.status(400).json({ error: 'propertyIds array is required' });
  }

  const results = await Promise.all(
    propertyIds.map(async (id: number) => {
      const input = await getPropertyFinancials(id);
      if (!input) return { propertyId: id, error: 'Not found' };
      return { propertyId: id, ...calculate(input) };
    }),
  );

  res.json(results);
});
