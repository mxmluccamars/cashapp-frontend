import type {
  Category,
  PaymentMethod,
  ContextItem,
  LocationItem,
  Goal,
  Transaction,
  TransactionCreate,
  RecurringBill,

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
  // getCategories: (): Promise<Category[]> => request<Category[]>('/categories/'),
  // getPaymentMethods: (): Promise<PaymentMethod[]> => request<PaymentMethod[]>('/payment_methods/'),
  // getContexts: (): Promise<ContextItem[]> => request<ContextItem[]>('/contexts/'),
  // getLocations: (): Promise<LocationItem[]> => request<LocationItem[]>('/locations/'),
  // getGoals: (): Promise<Goal[]> => request<Goal[]>('/goals/'),

  // Transações
  getTransactions: (): Promise<Transaction[]> => request<Transaction[]>('/transactions/'),
  createTransaction: (data: TransactionCreate): Promise<Transaction> =>
    request<Transaction>('/transactions/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  deleteTransaction: (id: string): Promise<void> =>
    request<void>(`/transactions/${id}`, { method: 'DELETE' }),


  // Categorias (CRUD)
  getCategories: (): Promise<Category[]> => request<Category[]>('/categories/'),
  createCategory: (data: Omit<Category, 'id'>): Promise<Category> =>
    request<Category>('/categories/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateCategory: (id: string, data: Partial<Omit<Category, 'id'>>): Promise<Category> =>
    request<Category>(`/categories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteCategory: (id: string): Promise<void> =>
    request<void>(`/categories/${id}`, { method: 'DELETE' }),


  // Contextos (CRUD)
  getContexts: (): Promise<ContextItem[]> => request<ContextItem[]>('/contexts/'),
  createContext: (data: { name: string }): Promise<ContextItem> =>
    request<ContextItem>('/contexts/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateContext: (id: string, data: { name: string }): Promise<ContextItem> =>
    request<ContextItem>(`/contexts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteContext: (id: string): Promise<void> =>
    request<void>(`/contexts/${id}`, { method: 'DELETE' }),


  // Locais (CRUD)
  getLocations: (): Promise<LocationItem[]> => request<LocationItem[]>('/locations/'),
  createLocation: (data: Omit<LocationItem, 'id'>): Promise<LocationItem> =>
    request<LocationItem>('/locations/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateLocation: (id: string, data: Partial<Omit<LocationItem, 'id'>>): Promise<LocationItem> =>
    request<LocationItem>(`/locations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteLocation: (id: string): Promise<void> =>
    request<void>(`/locations/${id}`, { method: 'DELETE' }),


  // Formas de Pagamento (CRUD)
  getPaymentMethods: (): Promise<PaymentMethod[]> =>
    request<PaymentMethod[]>('/payment_methods/'),
  createPaymentMethod: (data: Omit<PaymentMethod, 'id'>): Promise<PaymentMethod> =>
    request<PaymentMethod>('/payment_methods/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updatePaymentMethod: (
    id: string,
    data: Partial<Omit<PaymentMethod, 'id'>>
  ): Promise<PaymentMethod> =>
    request<PaymentMethod>(`/payment_methods/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deletePaymentMethod: (id: string): Promise<void> =>
    request<void>(`/payment_methods/${id}`, { method: 'DELETE' }),

  // Caixinhas / Metas (CRUD)
  getGoals: (): Promise<Goal[]> => request<Goal[]>('/goals/'),
  createGoal: (data: Omit<Goal, 'id'>): Promise<Goal> =>
    request<Goal>('/goals/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateGoal: (id: string, data: Partial<Omit<Goal, 'id'>>): Promise<Goal> =>
    request<Goal>(`/goals/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteGoal: (id: string): Promise<void> =>
    request<void>(`/goals/${id}`, { method: 'DELETE' }),


  // Contas Recorrentes (CRUD)
  getRecurringBills: (): Promise<RecurringBill[]> =>
    request<RecurringBill[]>('/recurring_bills/'),
  createRecurringBill: (data: Omit<RecurringBill, 'id'>): Promise<RecurringBill> =>
    request<RecurringBill>('/recurring_bills/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateRecurringBill: (
    id: string,
    data: Partial<Omit<RecurringBill, 'id'>>
  ): Promise<RecurringBill> =>
    request<RecurringBill>(`/recurring-_bills/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteRecurringBill: (id: string): Promise<void> =>
    request<void>(`/recurring_bills/${id}`, { method: 'DELETE' }),
};




