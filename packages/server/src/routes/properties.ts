import { Router } from 'express';
import { getDb, dbAvailable } from '../services/db.js';

export const propertiesRouter = Router();

// GET /api/properties — list all
propertiesRouter.get('/', async (_req, res) => {
  if (!dbAvailable) return res.status(503).json({ error: 'Database not available' });
  const db = getDb()!;
  const { rows } = await db.query(
    'SELECT * FROM properties ORDER BY created_at DESC',
  );
  res.json(rows);
});

// POST /api/properties — create
propertiesRouter.post('/', async (req, res) => {
  if (!dbAvailable) return res.status(503).json({ error: 'Database not available' });
  const db = getDb()!;
  const { name, address, city, state, zip, property_type, unit_count, notes } = req.body;

  if (!name) return res.status(400).json({ error: 'name is required' });

  const { rows } = await db.query(
    `INSERT INTO properties (name, address, city, state, zip, property_type, unit_count, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [name, address || null, city || null, state || null, zip || null, property_type || 'single_family', unit_count || 1, notes || null],
  );

  const property = rows[0];

  // Create default financial rows
  await db.query('INSERT INTO acquisition_costs (property_id) VALUES ($1)', [property.id]);
  await db.query('INSERT INTO financing (property_id) VALUES ($1)', [property.id]);
  await db.query('INSERT INTO rental_income (property_id) VALUES ($1)', [property.id]);

  res.status(201).json(property);
});

// GET /api/properties/:id
propertiesRouter.get('/:id', async (req, res) => {
  if (!dbAvailable) return res.status(503).json({ error: 'Database not available' });
  const db = getDb()!;
  const { rows } = await db.query('SELECT * FROM properties WHERE id = $1', [req.params.id]);
  if (rows.length === 0) return res.status(404).json({ error: 'Property not found' });
  res.json(rows[0]);
});

// PUT /api/properties/:id
propertiesRouter.put('/:id', async (req, res) => {
  if (!dbAvailable) return res.status(503).json({ error: 'Database not available' });
  const db = getDb()!;
  const { name, address, city, state, zip, property_type, unit_count, status, notes } = req.body;

  const { rows } = await db.query(
    `UPDATE properties
     SET name = COALESCE($1, name),
         address = COALESCE($2, address),
         city = COALESCE($3, city),
         state = COALESCE($4, state),
         zip = COALESCE($5, zip),
         property_type = COALESCE($6, property_type),
         unit_count = COALESCE($7, unit_count),
         status = COALESCE($8, status),
         notes = COALESCE($9, notes),
         updated_at = NOW()
     WHERE id = $10
     RETURNING *`,
    [name, address, city, state, zip, property_type, unit_count, status, notes, req.params.id],
  );

  if (rows.length === 0) return res.status(404).json({ error: 'Property not found' });
  res.json(rows[0]);
});

// DELETE /api/properties/:id
propertiesRouter.delete('/:id', async (req, res) => {
  if (!dbAvailable) return res.status(503).json({ error: 'Database not available' });
  const db = getDb()!;
  const { rowCount } = await db.query('DELETE FROM properties WHERE id = $1', [req.params.id]);
  if (rowCount === 0) return res.status(404).json({ error: 'Property not found' });
  res.json({ deleted: true });
});
