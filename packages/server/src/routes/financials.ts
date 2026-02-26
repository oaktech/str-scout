import { Router } from 'express';
import { getDb, dbAvailable } from '../services/db.js';

export const financialsRouter = Router();

const dbGuard = (_req: any, res: any, next: any) => {
  if (!dbAvailable) return res.status(503).json({ error: 'Database not available' });
  next();
};

// --- Acquisition Costs ---

financialsRouter.get('/:id/acquisition', dbGuard, async (req, res) => {
  const db = getDb()!;
  const { rows } = await db.query('SELECT * FROM acquisition_costs WHERE property_id = $1', [req.params.id]);
  if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
  res.json(rows[0]);
});

financialsRouter.put('/:id/acquisition', dbGuard, async (req, res) => {
  const db = getDb()!;
  const { purchase_price, closing_costs, renovation } = req.body;
  const { rows } = await db.query(
    `UPDATE acquisition_costs
     SET purchase_price = COALESCE($1, purchase_price),
         closing_costs = COALESCE($2, closing_costs),
         renovation = COALESCE($3, renovation),
         updated_at = NOW()
     WHERE property_id = $4
     RETURNING *`,
    [purchase_price, closing_costs, renovation, req.params.id],
  );
  if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
  res.json(rows[0]);
});

// --- Financing ---

financialsRouter.get('/:id/financing', dbGuard, async (req, res) => {
  const db = getDb()!;
  const { rows } = await db.query('SELECT * FROM financing WHERE property_id = $1', [req.params.id]);
  if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
  res.json(rows[0]);
});

financialsRouter.put('/:id/financing', dbGuard, async (req, res) => {
  const db = getDb()!;
  const { down_payment_pct, interest_rate, loan_term_years, is_cash_purchase } = req.body;
  const { rows } = await db.query(
    `UPDATE financing
     SET down_payment_pct = COALESCE($1, down_payment_pct),
         interest_rate = COALESCE($2, interest_rate),
         loan_term_years = COALESCE($3, loan_term_years),
         is_cash_purchase = COALESCE($4, is_cash_purchase),
         updated_at = NOW()
     WHERE property_id = $5
     RETURNING *`,
    [down_payment_pct, interest_rate, loan_term_years, is_cash_purchase, req.params.id],
  );
  if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
  res.json(rows[0]);
});

// --- Rental Income ---

financialsRouter.get('/:id/income', dbGuard, async (req, res) => {
  const db = getDb()!;
  const { rows } = await db.query('SELECT * FROM rental_income WHERE property_id = $1', [req.params.id]);
  if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
  res.json(rows[0]);
});

financialsRouter.put('/:id/income', dbGuard, async (req, res) => {
  const db = getDb()!;
  const { nightly_rate, occupancy_pct, avg_stay_nights } = req.body;
  const { rows } = await db.query(
    `UPDATE rental_income
     SET nightly_rate = COALESCE($1, nightly_rate),
         occupancy_pct = COALESCE($2, occupancy_pct),
         avg_stay_nights = COALESCE($3, avg_stay_nights),
         updated_at = NOW()
     WHERE property_id = $4
     RETURNING *`,
    [nightly_rate, occupancy_pct, avg_stay_nights, req.params.id],
  );
  if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
  res.json(rows[0]);
});
