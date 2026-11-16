import type {
  Category,
  PaymentMethod,
  ContextItem,
  LocationItem,
  Goal,
  Transaction,
  TransactionCreate,
} from '../types/finance';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Erro HTTP: ${response.status}`);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const api = {
  // Catálogos para os selects do Pit Stop
  getCategories: (): Promise<Category[]> => request<Category[]>('/categories/'),
  getPaymentMethods: (): Promise<PaymentMethod[]> => request<PaymentMethod[]>('/payment_methods/'),
  getContexts: (): Promise<ContextItem[]> => request<ContextItem[]>('/contexts/'),
  getLocations: (): Promise<LocationItem[]> => request<LocationItem[]>('/locations/'),
  getGoals: (): Promise<Goal[]> => request<Goal[]>('/goals/'),

  // Transações
  getTransactions: (): Promise<Transaction[]> => request<Transaction[]>('/transactions/'),
  createTransaction: (data: TransactionCreate): Promise<Transaction> =>
    request<Transaction>('/transactions/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  deleteTransaction: (id: string): Promise<void> =>
    request<void>(`/transactions/${id}`, { method: 'DELETE' }),
};