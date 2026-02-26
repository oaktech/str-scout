import type {
  Property,
  AcquisitionCosts,
  Financing,
  RentalIncome,
  OperatingExpense,
  Document,
  ExtractedField,
  CalculationResult,
  DashboardData,
} from '../types';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  return res.json();
}

// Property Lookup
export interface PropertyLookupData {
  estimatedValue: number | null;
  taxAssessment: number | null;
  propertyType: string | null;
  unitCount: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  sqft: number | null;
  yearBuilt: number | null;
  lotSqft: number | null;
  insuranceEstimate: number | null;
}

interface LookupResponse {
  found: boolean;
  cached?: boolean;
  data: PropertyLookupData | null;
}

export async function lookupProperty(
  address: string, city?: string, state?: string, zip?: string,
): Promise<PropertyLookupData | null> {
  const params = new URLSearchParams({ address });
  if (city) params.set('city', city);
  if (state) params.set('state', state);
  if (zip) params.set('zip', zip);

  const res = await request<LookupResponse>(`/lookup?${params.toString()}`);
  return res.found ? res.data : null;
}

// Properties
export const getProperties = () => request<Property[]>('/properties');
export const getProperty = (id: number) => request<Property>(`/properties/${id}`);
export const createProperty = (data: Partial<Property>) =>
  request<Property>('/properties', { method: 'POST', body: JSON.stringify(data) });
export const updateProperty = (id: number, data: Partial<Property>) =>
  request<Property>(`/properties/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteProperty = (id: number) =>
  request<{ deleted: boolean }>(`/properties/${id}`, { method: 'DELETE' });

// Financials
export const getAcquisition = (id: number) => request<AcquisitionCosts>(`/properties/${id}/acquisition`);
export const updateAcquisition = (id: number, data: Partial<AcquisitionCosts>) =>
  request<AcquisitionCosts>(`/properties/${id}/acquisition`, { method: 'PUT', body: JSON.stringify(data) });

export const getFinancing = (id: number) => request<Financing>(`/properties/${id}/financing`);
export const updateFinancing = (id: number, data: Partial<Financing>) =>
  request<Financing>(`/properties/${id}/financing`, { method: 'PUT', body: JSON.stringify(data) });

export const getIncome = (id: number) => request<RentalIncome>(`/properties/${id}/income`);
export const updateIncome = (id: number, data: Partial<RentalIncome>) =>
  request<RentalIncome>(`/properties/${id}/income`, { method: 'PUT', body: JSON.stringify(data) });

// Expenses
export const getExpenses = (id: number) => request<OperatingExpense[]>(`/properties/${id}/expenses`);
export const createExpense = (id: number, data: Partial<OperatingExpense>) =>
  request<OperatingExpense>(`/properties/${id}/expenses`, { method: 'POST', body: JSON.stringify(data) });
export const updateExpense = (propertyId: number, expenseId: number, data: Partial<OperatingExpense>) =>
  request<OperatingExpense>(`/properties/${propertyId}/expenses/${expenseId}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteExpense = (propertyId: number, expenseId: number) =>
  request<{ deleted: boolean }>(`/properties/${propertyId}/expenses/${expenseId}`, { method: 'DELETE' });

// Calculations
export const getCalculations = (id: number) => request<CalculationResult>(`/properties/${id}/calculations`);
export const compareProperties = (propertyIds: number[]) =>
  request<Array<CalculationResult & { propertyId: number }>>('/compare', {
    method: 'POST',
    body: JSON.stringify({ propertyIds }),
  });

// Dashboard
export const getDashboard = () => request<DashboardData>('/dashboard');

// Documents
export const getDocuments = (propertyId: number) => request<Document[]>(`/properties/${propertyId}/documents`);

export async function uploadDocument(propertyId: number, file: File): Promise<Document> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`/api/properties/${propertyId}/documents`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  return res.json();
}

export const deleteDocument = (docId: number) =>
  request<{ deleted: boolean }>(`/documents/${docId}`, { method: 'DELETE' });
export const triggerExtraction = (docId: number) =>
  request<{ extracted: number; fields: ExtractedField[] }>(`/documents/${docId}/extract`, { method: 'POST' });
export const getExtracted = (docId: number) => request<ExtractedField[]>(`/documents/${docId}/extracted`);
export const updateExtracted = (extractId: number, data: { status: string; field_value?: string }) =>
  request<ExtractedField>(`/extracted/${extractId}`, { method: 'PUT', body: JSON.stringify(data) });
export const applyExtracted = (propertyId: number) =>
  request<{ applied: number }>(`/properties/${propertyId}/apply-extracted`, { method: 'POST' });
