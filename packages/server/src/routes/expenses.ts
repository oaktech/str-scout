import { Router } from 'express';
import { getDb, dbAvailable } from '../services/db.js';

export const expensesRouter = Router();

const dbGuard = (_req: any, res: any, next: any) => {
  if (!dbAvailable) return res.status(503).json({ error: 'Database not available' });
  next();
};

// GET /api/properties/:id/expenses
expensesRouter.get('/:id/expenses', dbGuard, async (req, res) => {
  const db = getDb()!;
  const { rows } = await db.query(
    'SELECT * FROM operating_expenses WHERE property_id = $1 ORDER BY category, label',
    [req.params.id],
  );
  res.json(rows);
});

// POST /api/properties/:id/expenses
expensesRouter.post('/:id/expenses', dbGuard, async (req, res) => {
  const db = getDb()!;
  const { category, label, amount, frequency, is_percentage } = req.body;

  if (!category || !label) {
    return res.status(400).json({ error: 'category and label are required' });
  }

  const { rows } = await db.query(
    `INSERT INTO operating_expenses (property_id, category, label, amount, frequency, is_percentage)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [req.params.id, category, label, amount || 0, frequency || 'monthly', is_percentage || false],
  );
  res.status(201).json(rows[0]);
});

// PUT /api/properties/:id/expenses/:eid
expensesRouter.put('/:id/expenses/:eid', dbGuard, async (req, res) => {
  const db = getDb()!;
  const { category, label, amount, frequency, is_percentage } = req.body;

  const { rows } = await db.query(
    `UPDATE operating_expenses
     SET category = COALESCE($1, category),
         label = COALESCE($2, label),
         amount = COALESCE($3, amount),
         frequency = COALESCE($4, frequency),
         is_percentage = COALESCE($5, is_percentage),
         updated_at = NOW()
     WHERE id = $6 AND property_id = $7
     RETURNING *`,
    [category, label, amount, frequency, is_percentage, req.params.eid, req.params.id],
  );
  if (rows.length === 0) return res.status(404).json({ error: 'Expense not found' });
  res.json(rows[0]);
});

// DELETE /api/properties/:id/expenses/:eid
expensesRouter.delete('/:id/expenses/:eid', dbGuard, async (req, res) => {
  const db = getDb()!;
  const { rowCount } = await db.query(
    'DELETE FROM operating_expenses WHERE id = $1 AND property_id = $2',
    [req.params.eid, req.params.id],
  );
  if (rowCount === 0) return res.status(404).json({ error: 'Expense not found' });
  res.json({ deleted: true });
});
