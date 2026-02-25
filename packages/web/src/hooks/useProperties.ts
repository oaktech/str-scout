import { useState, useEffect, useCallback } from 'react';
import type {
  Property,
  AcquisitionCosts,
  Financing,
  RentalIncome,
  OperatingExpense,
  CalculationResult,
  DashboardData,
} from '../types';
import * as api from '../services/api';

export function useDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api.getDashboard();
      setData(result);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { data, loading, error, refresh };
}

export function useProperty(id: number) {
  const [property, setProperty] = useState<Property | null>(null);
  const [acquisition, setAcquisition] = useState<AcquisitionCosts | null>(null);
  const [financing, setFinancing] = useState<Financing | null>(null);
  const [income, setIncome] = useState<RentalIncome | null>(null);
  const [expenses, setExpenses] = useState<OperatingExpense[]>([]);
  const [calculations, setCalculations] = useState<CalculationResult | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [prop, acq, fin, inc, exp, calc] = await Promise.all([
        api.getProperty(id),
        api.getAcquisition(id),
        api.getFinancing(id),
        api.getIncome(id),
        api.getExpenses(id),
        api.getCalculations(id),
      ]);
      setProperty(prop);
      setAcquisition(acq);
      setFinancing(fin);
      setIncome(inc);
      setExpenses(exp);
      setCalculations(calc);
    } catch {
      // Property may not exist
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { refresh(); }, [refresh]);

  return { property, acquisition, financing, income, expenses, calculations, loading, refresh };
}
