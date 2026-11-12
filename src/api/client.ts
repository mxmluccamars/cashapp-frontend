import type { Category, Transaction, CreateTransactionDTO } from '../types';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export const api = {
  async getCategories(): Promise<Category[]> {
    const res = await fetch(`${BASE_URL}/categories/`);
    if (!res.ok) throw new Error('Erro ao buscar categorias');
    return res.json();
  },

  async getTransactions(): Promise<Transaction[]> {
    const res = await fetch(`${BASE_URL}/transactions/`);
    if (!res.ok) throw new Error('Erro ao buscar transações');
    return res.json();
  },

  async createTransaction(payload: CreateTransactionDTO): Promise<Transaction> {
    const res = await fetch(`${BASE_URL}/transactions/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Erro ao registrar transação');
    }

    return res.json();
  },

  async deleteTransaction(id: string): Promise<void> {
    const res = await fetch(`${BASE_URL}/transactions/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Erro ao deletar transação');
  },
};