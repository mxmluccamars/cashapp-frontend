export interface Category {
  id: string;
  name: string;
  type: 'EXPENSE' | 'INCOME';
  icon?: string;
  color?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number | string;
  date: string;
  type: 'EXPENSE' | 'INCOME';
  notes?: string | null;
  category_id: string;
  category?: Category;
  created_at: string;
  updated_at: string;
}

export interface CreateTransactionDTO {
  description: string;
  amount: number;
  date: string;
  type: 'EXPENSE' | 'INCOME';
  notes?: string;
  category_id: string;
}