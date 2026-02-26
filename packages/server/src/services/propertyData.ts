import { getDb } from './db.js';
import type { CalculationInput, ExpenseItem } from './calculations.js';

/** Fetch all financial data for a property and shape it into CalculationInput */
export async function getPropertyFinancials(propertyId: number): Promise<CalculationInput | null> {
  const db = getDb()!;

  const [propRes, acqRes, finRes, incRes, expRes] = await Promise.all([
    db.query('SELECT * FROM properties WHERE id = $1', [propertyId]),
    db.query('SELECT * FROM acquisition_costs WHERE property_id = $1', [propertyId]),
    db.query('SELECT * FROM financing WHERE property_id = $1', [propertyId]),
    db.query('SELECT * FROM rental_income WHERE property_id = $1', [propertyId]),
    db.query('SELECT * FROM operating_expenses WHERE property_id = $1', [propertyId]),
  ]);

  if (propRes.rows.length === 0) return null;

  const prop = propRes.rows[0];
  const acq = acqRes.rows[0] || { purchase_price: 0, closing_costs: 0, renovation: 0 };
  const fin = finRes.rows[0] || { down_payment_pct: 20, interest_rate: 7, loan_term_years: 30, is_cash_purchase: false };
  const inc = incRes.rows[0] || { nightly_rate: 0, occupancy_pct: 65, avg_stay_nights: 3 };

  const expenses: ExpenseItem[] = expRes.rows.map((e: any) => ({
    amount: parseFloat(e.amount),
    frequency: e.frequency as 'monthly' | 'annual' | 'per_turnover',
    isPercentage: !!e.is_percentage,
  }));

  return {
    acquisition: {
      purchasePrice: parseFloat(acq.purchase_price),
      closingCosts: parseFloat(acq.closing_costs),
      renovation: parseFloat(acq.renovation),
    },
    financing: {
      downPaymentPct: parseFloat(fin.down_payment_pct),
      interestRate: parseFloat(fin.interest_rate),
      loanTermYears: fin.loan_term_years,
      isCashPurchase: !!fin.is_cash_purchase,
    },
    income: {
      nightlyRate: parseFloat(inc.nightly_rate),
      occupancyPct: parseFloat(inc.occupancy_pct),
      avgStayNights: parseFloat(inc.avg_stay_nights),
    },
    expenses,
    unitCount: prop.unit_count,
  };
}
