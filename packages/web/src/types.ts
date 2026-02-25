export type PropertyStatus = 'analyzing' | 'active' | 'sold' | 'archived';
export type PropertyType = 'single_family' | 'condo' | 'townhouse' | 'multi_family' | 'cabin' | 'other';
export type ExpenseFrequency = 'monthly' | 'annual' | 'per_turnover';

export interface Property {
  id: number;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  property_type: PropertyType;
  unit_count: number;
  status: PropertyStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface AcquisitionCosts {
  id: number;
  property_id: number;
  purchase_price: number;
  closing_costs: number;
  renovation: number;
}

export interface Financing {
  id: number;
  property_id: number;
  down_payment_pct: number;
  interest_rate: number;
  loan_term_years: number;
  is_cash_purchase: boolean;
}

export interface RentalIncome {
  id: number;
  property_id: number;
  nightly_rate: number;
  occupancy_pct: number;
  avg_stay_nights: number;
}

export interface OperatingExpense {
  id: number;
  property_id: number;
  category: string;
  label: string;
  amount: number;
  frequency: ExpenseFrequency;
  is_percentage: boolean;
}

export interface Document {
  id: number;
  property_id: number;
  filename: string;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  storage_path: string;
  uploaded_at: string;
}

export interface ExtractedField {
  id: number;
  document_id: number;
  property_id: number;
  field_name: string;
  field_value: string;
  confidence: number;
  label: string;
  status: 'pending' | 'accepted' | 'rejected' | 'applied';
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

export interface CalculationResult {
  monthlyRevenue: number;
  annualRevenue: number;
  monthlyPI: number;
  annualDebtService: number;
  loanAmount: number;
  downPayment: number;
  annualExpenses: number;
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
  tenYearProjection: YearProjection[];
  tenYearNetReturn: number;
  cagr: number;
}

export interface DashboardData {
  portfolio: {
    totalRevenue: number;
    totalCashFlow: number;
    totalNoi: number;
    totalInvested: number;
    propertyCount: number;
    cashOnCash: number;
  };
  properties: Array<Property & {
    metrics: {
      monthlyRevenue: number;
      monthlyCashFlow: number;
      cashOnCash: number;
      capRate: number;
      dscr: number;
      noi: number;
      totalCashInvested: number;
    } | null;
  }>;
}

export type Page =
  | { name: 'dashboard' }
  | { name: 'add-property' }
  | { name: 'property'; id: number }
  | { name: 'compare' };
