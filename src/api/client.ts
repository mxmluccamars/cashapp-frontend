import type { Category, Transaction, CreateTransactionDTO } from '../types';

const BASE_URL = 'http://localhost:8000/api/v1';

export const api = {
  async getCategories(): Promise {
    const res = await fetch(`${BASE_URL}/categories/`);
    if (!res.ok) throw new Error('Erro ao buscar categorias');
    return res.json();
  },

  async getTransactions(): Promise {
    const res = await fetch(`${BASE_URL}/transactions/`);
    if (!res.ok) throw new Error('Erro ao buscar transações');
    return res.json();
  },

  async createTransaction(payload: CreateTransactionDTO): Promise {
    const res = await fetch(`${BASE_URL}/transactions/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Erro ao registrar movimentação');
    }

    return res.json();
  },

  async deleteTransaction(id: string): Promise {
    const res = await fetch(`\({BASE_URL}/transactions/\){id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Erro ao excluir movimentação');
  }
};