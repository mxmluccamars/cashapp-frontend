export type TransactionType = 'EXPENSE' | 'INCOME';

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  icon?: string;
  color?: string;
  monthly_limit?: number | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentMethod {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  allows_installments: boolean;
  created_at: string;
}

export interface Context {
  id: string;
  name: string;
  created_at: string;
}

export interface Location {
  id: string;
  name: string;
  city?: string | null;
  state?: string | null;
  created_at: string;
}

export interface Goal {
  id: string;
  name: string;
  description?: string | null;
  target_amount: number;
  target_date?: string | null;
  icon?: string;
  color?: string;
  created_at: string;
}

export interface RecurringBill {
  id: string;
  name: string;
  amount: number;
  due_day: number;
  category_id?: string | null;
  payment_method_id?: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  type: TransactionType;
  notes?: string | null;
  
  category_id: string;
  category?: Category;

  payment_method_id?: string | null;
  payment_method?: PaymentMethod | null;

  context_id?: string | null;
  context?: Context | null;

  location_id?: string | null;
  location?: Location | null;

  goal_id?: string | null;
  goal?: Goal | null;

  recurring_bill_id?: string | null;
  recurring_bill?: RecurringBill | null;

  installment_current?: number | null;
  installment_total?: number | null;
  installment_group_id?: string | null;

  created_at: string;
  updated_at: string;
}

export interface CreateTransactionDTO {
  description: string;
  amount: number;
  date: string;
  type: TransactionType;
  notes?: string;
  category_id: string;
  payment_method_id?: string;
  context_id?: string;
  location_id?: string;
  goal_id?: string;
  recurring_bill_id?: string;
  installments?: number;
}