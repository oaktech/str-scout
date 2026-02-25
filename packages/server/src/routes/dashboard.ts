import { Router } from 'express';
import { getPool, dbAvailable } from '../services/db.js';
import { calculate } from '../services/calculations.js';
import { getPropertyFinancials } from '../services/propertyData.js';

export const dashboardRouter = Router();

// GET /api/dashboard — portfolio summary
dashboardRouter.get('/dashboard', async (_req, res) => {
  if (!dbAvailable) return res.status(503).json({ error: 'Database not available' });
  const pool = getPool()!;

  const { rows: properties } = await pool.query(
    'SELECT id, name, address, city, state, property_type, unit_count, status, created_at FROM properties ORDER BY created_at DESC',
  );

  const propertySummaries = await Promise.all(
    properties.map(async (prop: any) => {
      const input = await getPropertyFinancials(prop.id);
      const metrics = input ? calculate(input) : null;
      return {
        ...prop,
        metrics: metrics
          ? {
              monthlyRevenue: metrics.monthlyRevenue,
              monthlyCashFlow: metrics.monthlyCashFlow,
              cashOnCash: metrics.cashOnCash,
              capRate: metrics.capRate,
              dscr: metrics.dscr,
              noi: metrics.noi,
              totalCashInvested: metrics.totalCashInvested,
            }
          : null,
      };
    }),
  );

  // Portfolio totals
  const totals = propertySummaries.reduce(
    (acc, p) => {
      if (!p.metrics) return acc;
      acc.totalRevenue += p.metrics.monthlyRevenue * 12;
      acc.totalCashFlow += p.metrics.monthlyCashFlow * 12;
      acc.totalNoi += p.metrics.noi;
      acc.totalInvested += p.metrics.totalCashInvested;
      acc.propertyCount += 1;
      return acc;
    },
    { totalRevenue: 0, totalCashFlow: 0, totalNoi: 0, totalInvested: 0, propertyCount: 0 },
  );

  const portfolioCashOnCash = totals.totalInvested > 0 ? totals.totalCashFlow / totals.totalInvested : 0;

  res.json({
    portfolio: { ...totals, cashOnCash: portfolioCashOnCash },
    properties: propertySummaries,
  });
});
