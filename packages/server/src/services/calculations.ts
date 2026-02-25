/**
 * Pure calculation functions — no DB dependency.
 * All money values in dollars, rates as decimals (e.g. 0.07 = 7%).
 */

export interface AcquisitionInput {
  purchasePrice: number;
  closingCosts: number;
  renovation: number;
}

export interface FinancingInput {
  downPaymentPct: number; // e.g. 20 for 20%
  interestRate: number;   // e.g. 7 for 7%
  loanTermYears: number;
  isCashPurchase: boolean;
}

export interface IncomeInput {
  nightlyRate: number;
  occupancyPct: number;  // e.g. 65 for 65%
  avgStayNights: number;
}

export interface ExpenseItem {
  amount: number;
  frequency: 'monthly' | 'annual' | 'per_turnover';
  isPercentage: boolean;
}

export interface CalculationInput {
  acquisition: AcquisitionInput;
  financing: FinancingInput;
  income: IncomeInput;
  expenses: ExpenseItem[];
  unitCount: number;
}

export interface CalculationResult {
  // Revenue
  monthlyRevenue: number;
  annualRevenue: number;

  // Loan
  monthlyPI: number;
  annualDebtService: number;
  loanAmount: number;
  downPayment: number;

  // Expenses
  annualExpenses: number;

  // Core metrics
  noi: number;
  totalCashInvested: number;
  cashOnCash: number;
  grossYield: number;
  capRate: number;
  dscr: number;
  monthlyCashFlow: number;
  annualCashFlow: number;
  breakEvenOccupancy: number;
  grm: number;
  pricePerDoor: number;

  // 10-year projections
  tenYearProjection: YearProjection[];
  tenYearNetReturn: number;
  cagr: number;
}

export interface YearProjection {
  year: number;
  revenue: number;
  expenses: number;
  noi: number;
  debtService: number;
  cashFlow: number;
  propertyValue: number;
  equity: number;
  cumulativeCashFlow: number;
}

/** Monthly P&I payment using standard amortization formula */
export function calcMonthlyPI(principal: number, annualRate: number, years: number): number {
  if (principal <= 0 || years <= 0) return 0;
  if (annualRate <= 0) return principal / (years * 12);

  const r = annualRate / 100 / 12;
  const n = years * 12;
  return principal * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

/** Remaining loan balance after a given number of months */
function remainingBalance(principal: number, annualRate: number, totalMonths: number, monthsPaid: number): number {
  if (principal <= 0 || annualRate <= 0) return Math.max(0, principal - (principal / totalMonths) * monthsPaid);
  const r = annualRate / 100 / 12;
  const factor = Math.pow(1 + r, totalMonths);
  const factorPaid = Math.pow(1 + r, monthsPaid);
  return principal * (factor - factorPaid) / (factor - 1);
}

/** Normalize a single expense item to annual dollars */
export function normalizeExpense(
  item: ExpenseItem,
  annualRevenue: number,
  nightlyRate: number,
  avgStayNights: number,
): number {
  let base = item.amount;

  if (item.isPercentage) {
    base = (item.amount / 100) * annualRevenue;
    // Percentage items are already annualized
    return base;
  }

  switch (item.frequency) {
    case 'monthly':
      return base * 12;
    case 'annual':
      return base;
    case 'per_turnover': {
      const nightsBooked = annualRevenue / (nightlyRate || 1);
      const turnovers = nightsBooked / (avgStayNights || 3);
      return base * turnovers;
    }
    default:
      return base * 12;
  }
}

/** Run all calculations from raw inputs */
export function calculate(input: CalculationInput): CalculationResult {
  const { acquisition, financing, income, expenses, unitCount } = input;
  const { purchasePrice, closingCosts, renovation } = acquisition;
  const { downPaymentPct, interestRate, loanTermYears, isCashPurchase } = financing;
  const { nightlyRate, occupancyPct, avgStayNights } = income;

  // Revenue
  const monthlyRevenue = nightlyRate * 30 * (occupancyPct / 100);
  const annualRevenue = monthlyRevenue * 12;

  // Loan
  const downPayment = isCashPurchase ? purchasePrice : purchasePrice * (downPaymentPct / 100);
  const loanAmount = isCashPurchase ? 0 : purchasePrice - downPayment;
  const monthlyPI = isCashPurchase ? 0 : calcMonthlyPI(loanAmount, interestRate, loanTermYears);
  const annualDebtService = monthlyPI * 12;

  // Expenses
  const annualExpenses = expenses.reduce(
    (sum, exp) => sum + normalizeExpense(exp, annualRevenue, nightlyRate, avgStayNights),
    0,
  );

  // Core metrics
  const noi = annualRevenue - annualExpenses;
  const totalCashInvested = downPayment + closingCosts + renovation;
  const annualCashFlow = noi - annualDebtService;
  const monthlyCashFlow = annualCashFlow / 12;

  const cashOnCash = totalCashInvested > 0 ? annualCashFlow / totalCashInvested : 0;
  const grossYield = purchasePrice > 0 ? annualRevenue / purchasePrice : 0;
  const capRate = purchasePrice > 0 ? noi / purchasePrice : 0;
  const dscr = annualDebtService > 0 ? noi / annualDebtService : noi > 0 ? Infinity : 0;

  const breakEvenOccupancy =
    nightlyRate > 0 ? (annualExpenses + annualDebtService) / (nightlyRate * 365) : 0;
  const grm = annualRevenue > 0 ? purchasePrice / annualRevenue : 0;
  const pricePerDoor = unitCount > 0 ? purchasePrice / unitCount : purchasePrice;

  // 10-year projection (3% annual appreciation, 2% expense growth, 3% revenue growth)
  const appreciationRate = 0.03;
  const expenseGrowth = 0.02;
  const revenueGrowth = 0.03;

  const tenYearProjection: YearProjection[] = [];
  let cumulativeCashFlow = 0;

  for (let year = 1; year <= 10; year++) {
    const yearRevenue = annualRevenue * Math.pow(1 + revenueGrowth, year - 1);
    const yearExpenses = annualExpenses * Math.pow(1 + expenseGrowth, year - 1);
    const yearNoi = yearRevenue - yearExpenses;
    const yearCashFlow = yearNoi - annualDebtService;
    cumulativeCashFlow += yearCashFlow;

    const propertyValue = purchasePrice * Math.pow(1 + appreciationRate, year);
    const loanBalance = isCashPurchase
      ? 0
      : remainingBalance(loanAmount, interestRate, loanTermYears * 12, year * 12);
    const equity = propertyValue - loanBalance;

    tenYearProjection.push({
      year,
      revenue: yearRevenue,
      expenses: yearExpenses,
      noi: yearNoi,
      debtService: annualDebtService,
      cashFlow: yearCashFlow,
      propertyValue,
      equity,
      cumulativeCashFlow,
    });
  }

  // 10-year net return: cumulative cash flow + equity buildup + appreciation - cash invested
  const year10 = tenYearProjection[9];
  const tenYearNetReturn = year10
    ? cumulativeCashFlow + year10.equity - totalCashInvested
    : 0;

  const endingValue = totalCashInvested + tenYearNetReturn;
  const cagr =
    totalCashInvested > 0 && endingValue > 0
      ? Math.pow(endingValue / totalCashInvested, 1 / 10) - 1
      : 0;

  return {
    monthlyRevenue,
    annualRevenue,
    monthlyPI,
    annualDebtService,
    loanAmount,
    downPayment,
    annualExpenses,
    noi,
    totalCashInvested,
    cashOnCash,
    grossYield,
    capRate,
    dscr,
    monthlyCashFlow,
    annualCashFlow,
    breakEvenOccupancy,
    grm,
    pricePerDoor,
    tenYearProjection,
    tenYearNetReturn,
    cagr,
  };
}
