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
import type { SystemMetrics } from '../types/system';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
const TOKEN_STORAGE_KEY = 'cashapp_auth_token';

export const AUTH_UNAUTHORIZED_EVENT = 'cashapp:unauthorized';

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setAuthToken(token: string): void {
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export function clearAuthToken(): void {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}

/** Verifica localmente pela data `exp` do JWT se os 7 dias já venceram */
export function hasValidLocalToken(): boolean {
  const token = getAuthToken();
  if (!token) return false;
  try {
    const payloadBase64 = token.split('.')[1];
    if (!payloadBase64) return false;
    const payload = JSON.parse(atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/')));
    if (typeof payload.exp !== 'number') return false;
    const nowInSeconds = Math.floor(Date.now() / 1000);
    if (payload.exp <= nowInSeconds) {
      clearAuthToken();
      return false;
    }
    return true;
  } catch {
    clearAuthToken();
    return false;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // Se não for a própria tentativa de login, derruba a sessão imediatamente
    if (!endpoint.startsWith('/auth/login')) {
      clearAuthToken();
      window.dispatchEvent(new Event(AUTH_UNAUTHORIZED_EVENT));
    }
    const errBody = await response.json().catch(() => ({}));
    throw new Error(errBody.detail || 'Sessão expirada. Digite seu PIN.');
  }

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    if (Array.isArray(errBody.detail) && errBody.detail.length > 0) {
      const first = errBody.detail[0];
      const field = Array.isArray(first?.loc) ? first.loc.slice(1).join('.') : 'body';
      throw new Error(`${field}: ${first?.msg || 'Validation error'}`);
    }
    throw new Error(errBody.detail || `Erro ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

export const api = {
  // Autenticação por PIN
  login: (pin: string): Promise<{ access_token: string; token_type: string; expires_at: string }> =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ pin }),
    }),


  // Infraestrutura (Neon + Render + Postgres)
  getSystemMetrics: (force = false): Promise<SystemMetrics> =>
    request<SystemMetrics>(`/system/metrics${force ? '?force=true' : ''}`),
    
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
  // Transações (Update e Delete)
  updateTransaction: (
    id: string,
    data: Partial<TransactionCreate>
  ): Promise<Transaction> =>
    request<Transaction>(`/transactions/${id}`, {
      method: 'PATCH',
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
    request<RecurringBill>(`/recurring_bills/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteRecurringBill: (id: string): Promise<void> =>
    request<void>(`/recurring_bills/${id}`, { method: 'DELETE' }),
};




