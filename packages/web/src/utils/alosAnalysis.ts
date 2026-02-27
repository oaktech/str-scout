import type { OperatingExpense, RentalIncome, CalculationResult } from '../types';

export interface AlosDataPoint {
  alos: number;
  staysPerYear: number;
  perStayCostsAnnual: number;
  fixedExpensesAnnual: number;
  totalExpenses: number;
  revenue: number;
  noi: number;
  noiMargin: number;
  cashFlow: number;
  perStayCostPct: number;
}

function isPerStay(freq: string): boolean {
  return freq === 'per_stay' || freq === 'per_turnover';
}

export function calculateAlosSensitivity(params: {
  income: RentalIncome;
  expenses: OperatingExpense[];
  calculations: CalculationResult;
  alosRange?: [number, number];
}): AlosDataPoint[] {
  const { income, expenses, calculations, alosRange = [2, 14] } = params;
  const { occupancy_pct } = income;
  const { annualRevenue, annualDebtService } = calculations;

  const totalNightsBooked = 365 * (occupancy_pct / 100);

  // Split expenses into fixed vs per-stay
  const perStayExpenses = expenses.filter((e) => isPerStay(e.frequency));
  const fixedExpenses = expenses.filter((e) => !isPerStay(e.frequency));

  const perStayCostPerTurn = perStayExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

  const fixedExpensesAnnual = fixedExpenses.reduce((sum, e) => {
    const amt = Number(e.amount);
    if (!amt) return sum;
    if (e.is_percentage) return sum + (amt / 100) * annualRevenue;
    if (e.frequency === 'monthly') return sum + amt * 12;
    return sum + amt; // annual
  }, 0);

  const points: AlosDataPoint[] = [];

  for (let alos = alosRange[0]; alos <= alosRange[1]; alos++) {
    const staysPerYear = totalNightsBooked / alos;
    const perStayCostsAnnual = perStayCostPerTurn * staysPerYear;
    const totalExpenses = fixedExpensesAnnual + perStayCostsAnnual;
    const noi = annualRevenue - totalExpenses;
    const noiMargin = annualRevenue > 0 ? noi / annualRevenue : 0;
    const cashFlow = noi - annualDebtService;
    const perStayCostPct = annualRevenue > 0 ? perStayCostsAnnual / annualRevenue : 0;

    points.push({
      alos,
      staysPerYear: Math.round(staysPerYear * 10) / 10,
      perStayCostsAnnual: Math.round(perStayCostsAnnual),
      fixedExpensesAnnual: Math.round(fixedExpensesAnnual),
      totalExpenses: Math.round(totalExpenses),
      revenue: Math.round(annualRevenue),
      noi: Math.round(noi),
      noiMargin,
      cashFlow: Math.round(cashFlow),
      perStayCostPct,
    });
  }

  return points;
}

/** Find the ALOS where margin improvement drops below 1% per night increase */
export function findSweetSpot(data: AlosDataPoint[]): number | null {
  for (let i = 1; i < data.length; i++) {
    const marginalGain = data[i].noiMargin - data[i - 1].noiMargin;
    if (marginalGain < 0.01) return data[i].alos;
  }
  return null;
}

/** Find minimum ALOS for positive cash flow */
export function findBreakEvenAlos(data: AlosDataPoint[]): number | null {
  for (const pt of data) {
    if (pt.cashFlow >= 0) return pt.alos;
  }
  return null;
}

/** NOI change per 1-night ALOS increase (average across range) */
export function calcSensitivityScore(data: AlosDataPoint[]): number {
  if (data.length < 2) return 0;
  const totalChange = data[data.length - 1].noi - data[0].noi;
  return Math.round(totalChange / (data.length - 1));
}

/** Check if property has any per-stay expenses */
export function hasPerStayExpenses(expenses: OperatingExpense[]): boolean {
  return expenses.some((e) => isPerStay(e.frequency) && Number(e.amount) > 0);
}
