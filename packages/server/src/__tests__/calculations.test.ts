import { describe, it, expect } from 'vitest';
import { calculate, calcMonthlyPI, normalizeExpense, type CalculationInput, type ExpenseItem } from '../services/calculations.js';

describe('calcMonthlyPI', () => {
  it('calculates standard 30yr mortgage payment', () => {
    // $240,000 loan at 7% for 30 years → ~$1,596.73
    const payment = calcMonthlyPI(240_000, 7, 30);
    expect(payment).toBeCloseTo(1596.73, 0);
  });

  it('returns 0 for zero principal', () => {
    expect(calcMonthlyPI(0, 7, 30)).toBe(0);
  });

  it('handles 0% interest (equal payments)', () => {
    const payment = calcMonthlyPI(120_000, 0, 10);
    expect(payment).toBeCloseTo(1000, 0); // 120k / 120 months
  });

  it('handles 15yr term', () => {
    const payment = calcMonthlyPI(200_000, 6.5, 15);
    expect(payment).toBeCloseTo(1742.21, 0);
  });
});

describe('normalizeExpense', () => {
  it('normalizes monthly to annual', () => {
    const item: ExpenseItem = { amount: 200, frequency: 'monthly', isPercentage: false };
    expect(normalizeExpense(item, 0, 0, 3)).toBe(2400);
  });

  it('passes annual through', () => {
    const item: ExpenseItem = { amount: 3600, frequency: 'annual', isPercentage: false };
    expect(normalizeExpense(item, 0, 0, 3)).toBe(3600);
  });

  it('normalizes percentage of revenue', () => {
    const item: ExpenseItem = { amount: 10, frequency: 'annual', isPercentage: true };
    expect(normalizeExpense(item, 60_000, 200, 3)).toBe(6000);
  });

  it('normalizes per-turnover expenses', () => {
    // $100/turnover, $200/night rate, 60k annual revenue, 3-night avg stay
    // nights booked = 60000 / 200 = 300, turnovers = 300 / 3 = 100
    const item: ExpenseItem = { amount: 100, frequency: 'per_turnover', isPercentage: false };
    expect(normalizeExpense(item, 60_000, 200, 3)).toBeCloseTo(10_000, 0);
  });
});

describe('calculate', () => {
  const baseInput: CalculationInput = {
    acquisition: { purchasePrice: 300_000, closingCosts: 9_000, renovation: 15_000 },
    financing: { downPaymentPct: 20, interestRate: 7, loanTermYears: 30, isCashPurchase: false },
    income: { nightlyRate: 200, occupancyPct: 65, avgStayNights: 3 },
    expenses: [
      { amount: 500, frequency: 'monthly', isPercentage: false },     // property management
      { amount: 3600, frequency: 'annual', isPercentage: false },     // insurance
      { amount: 4200, frequency: 'annual', isPercentage: false },     // property tax
      { amount: 75, frequency: 'per_turnover', isPercentage: false }, // cleaning
    ],
    unitCount: 1,
  };

  it('calculates revenue correctly', () => {
    const result = calculate(baseInput);
    // 200 * 30 * 0.65 = 3,900/month
    expect(result.monthlyRevenue).toBeCloseTo(3_900, 0);
    expect(result.annualRevenue).toBeCloseTo(46_800, 0);
  });

  it('calculates loan details', () => {
    const result = calculate(baseInput);
    expect(result.downPayment).toBe(60_000);
    expect(result.loanAmount).toBe(240_000);
    expect(result.monthlyPI).toBeCloseTo(1596.73, 0);
  });

  it('calculates expenses including per-turnover', () => {
    const result = calculate(baseInput);
    // monthly: 500*12=6000, insurance: 3600, tax: 4200
    // cleaning: 75 * (46800/200) / 3 = 75 * 78 = 5850
    const expectedExpenses = 6000 + 3600 + 4200 + 5850;
    expect(result.annualExpenses).toBeCloseTo(expectedExpenses, 0);
  });

  it('calculates core investment metrics', () => {
    const result = calculate(baseInput);
    expect(result.totalCashInvested).toBe(84_000); // 60k + 9k + 15k
    expect(result.noi).toBeGreaterThan(0);
    expect(result.cashOnCash).toBeGreaterThan(0);
    expect(result.capRate).toBeGreaterThan(0);
    expect(result.dscr).toBeGreaterThan(0);
  });

  it('calculates break-even occupancy', () => {
    const result = calculate(baseInput);
    // (expenses + debt) / (nightly * 365)
    expect(result.breakEvenOccupancy).toBeGreaterThan(0);
    expect(result.breakEvenOccupancy).toBeLessThan(1);
  });

  it('generates 10-year projection', () => {
    const result = calculate(baseInput);
    expect(result.tenYearProjection).toHaveLength(10);
    expect(result.tenYearProjection[0].year).toBe(1);
    expect(result.tenYearProjection[9].year).toBe(10);

    // Property value should appreciate
    expect(result.tenYearProjection[9].propertyValue).toBeGreaterThan(300_000);

    // Cumulative cash flow should grow
    expect(result.tenYearProjection[9].cumulativeCashFlow).toBeGreaterThan(
      result.tenYearProjection[0].cumulativeCashFlow,
    );
  });

  it('handles cash purchase (no loan)', () => {
    const cashInput: CalculationInput = {
      ...baseInput,
      financing: { downPaymentPct: 100, interestRate: 0, loanTermYears: 0, isCashPurchase: true },
    };
    const result = calculate(cashInput);
    expect(result.monthlyPI).toBe(0);
    expect(result.annualDebtService).toBe(0);
    expect(result.loanAmount).toBe(0);
    expect(result.downPayment).toBe(300_000);
    expect(result.dscr).toBe(Infinity);
    // All NOI flows to cash
    expect(result.annualCashFlow).toBe(result.noi);
  });

  it('handles 0% occupancy', () => {
    const emptyInput: CalculationInput = {
      ...baseInput,
      income: { nightlyRate: 200, occupancyPct: 0, avgStayNights: 3 },
    };
    const result = calculate(emptyInput);
    expect(result.monthlyRevenue).toBe(0);
    expect(result.annualRevenue).toBe(0);
    expect(result.monthlyCashFlow).toBeLessThan(0);
  });

  it('handles 100% occupancy', () => {
    const fullInput: CalculationInput = {
      ...baseInput,
      income: { nightlyRate: 200, occupancyPct: 100, avgStayNights: 3 },
    };
    const result = calculate(fullInput);
    expect(result.monthlyRevenue).toBe(6000); // 200 * 30 * 1.0
    expect(result.annualRevenue).toBe(72_000);
  });

  it('computes positive CAGR for profitable deal', () => {
    const result = calculate(baseInput);
    expect(result.cagr).toBeGreaterThan(0);
  });

  it('calculates GRM and price per door', () => {
    const result = calculate(baseInput);
    expect(result.grm).toBeCloseTo(300_000 / 46_800, 1);
    expect(result.pricePerDoor).toBe(300_000);
  });

  it('handles multi-unit price per door', () => {
    const multiUnit: CalculationInput = {
      ...baseInput,
      unitCount: 4,
    };
    const result = calculate(multiUnit);
    expect(result.pricePerDoor).toBe(75_000);
  });
});
