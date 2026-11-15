export type TransactionType = 'EXPENSE' | 'INCOME';

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  icon?: string;
  color?: string;
  monthly_limit?: number | null;
}

export interface PaymentMethod {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  allows_installments?: boolean;
}

export interface ContextItem {
  id: string;
  name: string;
}

export interface LocationItem {
  id: string;
  name: string;
  city?: string | null;
  state?: string | null;
}

export interface Goal {
  id: string;
  name: string;
  description?: string | null;
  target_amount: number;
  target_date?: string | null;
  icon?: string;
  color?: string;
}

export interface TransactionCreate {
  description: string;
  amount: number;
  date: string;
  type: TransactionType;
  notes?: string | null;
  category_id: string;
  payment_method_id?: string | null;
  context_id?: string | null;
  location_id?: string | null;
  goal_id?: string | null;
  installments?: number;
}

export interface Transaction extends Omit<TransactionCreate, 'installments'> {
  id: string;
  installment_current?: number | null;
  installment_total?: number | null;
  installment_group_id?: string | null;
  category?: Category | null;
  payment_method?: PaymentMethod | null;
  context?: ContextItem | null;
  location?: LocationItem | null;
  goal?: Goal | null;
}