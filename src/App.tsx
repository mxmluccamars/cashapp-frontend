import React, { useEffect, useState } from 'react';
import { api } from './api/client';
import type { Category, Transaction } from './types';
import { 
  ArrowDownCircle, 
  ArrowUpCircle, 
  Wallet, 
  PlusCircle, 
  Trash2 
} from 'lucide-react';

export default function App() {
  // 1. Estados para armazenar dados vindos da API
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // 2. Estados dos campos do formulário
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');
  const [categoryId, setCategoryId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // Função para carregar categorias e transações do backend
  const loadData = async () => {
    try {
      setLoading(true);
      const [cats, txs] = await Promise.all([
        api.getCategories(),
        api.getTransactions()
      ]);
      setCategories(cats);
      setTransactions(txs);

      // Pré-seleciona a primeira categoria se nenhuma estiver marcada
      if (cats.length > 0 && !categoryId) {
        setCategoryId(cats[0].id);
      }
    } catch (err) {
      console.error('Erro ao buscar dados do backend:', err);
    } finally {
      setLoading(false);
    }
  };

  // Carrega os dados assim que o app abre no navegador
  useEffect(() => {
    loadData();
  }, []);

  // Envia a nova transação para a API
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!description || !amount || !categoryId) {
      alert('Preencha todos os campos obrigatórios!');
      return;
    }

    try {
      await api.createTransaction({
        description,
        amount: Number(amount),
        type,
        category_id: categoryId,
        date
      });

      // Limpa os campos do formulário
      setDescription('');
      setAmount('');

      // Recarrega os dados com a lista atualizada
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Erro ao registrar movimentação');
    }
  };

  // Exclui uma transação
  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente apagar este lançamento?')) return;

    try {
      await api.deleteTransaction(id);
      await loadData();
    } catch (err) {
      alert('Falha ao excluir o lançamento');
    }
  };

  // Cálculos automáticos de balanço
  const totalIncome = transactions
    .filter(t => t.type === 'INCOME')
    .reduce((acc, t) => acc + Number(t.amount), 0);

  const totalExpense = transactions
    .filter(t => t.type === 'EXPENSE')
    .reduce((acc, t) => acc + Number(t.amount), 0);

  const balance = totalIncome - totalExpense;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-12">
      {/* Barra Superior */}
      <header className="bg-slate-900 text-white py-6 px-4 shadow">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <Wallet className="w-6 h-6 text-emerald-400" />
            CashApp
          </h1>
          <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-1 rounded-full border border-slate-700">
            v1.0 (Local)
          </span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 mt-8 space-y-8">
        {/* Seção 1: Resumo Financeiro */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-sm font-medium">Receitas</span>
              <ArrowUpCircle className="w-5 h-5 text-emerald-500" />
            </div>
            <p className="text-2xl font-bold text-emerald-600">
              R$ {totalIncome.toFixed(2)}
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-sm font-medium">Despesas</span>
              <ArrowDownCircle className="w-5 h-5 text-rose-500" />
            </div>
            <p className="text-2xl font-bold text-rose-600">
              R$ {totalExpense.toFixed(2)}
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-sm font-medium">Saldo Atual</span>
              <Wallet className="w-5 h-5 text-slate-400" />
            </div>
            <p className={`text-2xl font-bold ${balance >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>
              R$ {balance.toFixed(2)}
            </p>
          </div>
        </section>

        {/* Seção 2: Formulário de Lançamento */}
        <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-indigo-600" />
            Novo Lançamento
          </h2>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Descrição
              </label>
              <input
                type="text"
                placeholder="Ex: Almoço, Mercado..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                required
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Valor (R$)
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                required
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Tipo
                </label>
                <select
                  value={type}
                  onChange={e => setType(e.target.value as 'EXPENSE' | 'INCOME')}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="EXPENSE">Despesa</option>
                  <option value="INCOME">Receita</option>
                </select>
              </div>

              <div className="flex-1">
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Categoria
                </label>
                <select
                  value={categoryId}
                  onChange={e => setCategoryId(e.target.value)}
                  required
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Data
              </label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                required
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="md:col-span-2 pt-2">
              <button
                type="submit"
                className="w-full bg-slate-900 text-white font-medium py-2.5 rounded-lg text-sm hover:bg-slate-800 transition cursor-pointer"
              >
                Salvar Movimentação
              </button>
            </div>
          </form>
        </section>

        {/* Seção 3: Extrato de Transações */}
        <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Extrato Recente</h2>

          {loading ? (
            <p className="text-sm text-slate-500">Buscando dados no servidor...</p>
          ) : transactions.length === 0 ? (
            <p className="text-sm text-slate-500">Nenhuma movimentação registrada até o momento.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {transactions.map(tx => (
                <div key={tx.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span 
                      className="w-3.5 h-3.5 rounded-full"
                      style={{ backgroundColor: tx.category?.color || '#94a3b8' }}
                    />
                    <div>
                      <p className="text-sm font-medium text-slate-800">{tx.description}</p>
                      <p className="text-xs text-slate-400">
                        {tx.date} • {tx.category?.name || 'Sem categoria'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className={`text-sm font-semibold ${
                      tx.type === 'INCOME' ? 'text-emerald-600' : 'text-slate-800'
                    }`}>
                      {tx.type === 'INCOME' ? '+' : '-'} R$ {Number(tx.amount).toFixed(2)}
                    </span>
                    <button 
                      onClick={() => handleDelete(tx.id)}
                      className="text-slate-400 hover:text-rose-600 transition p-1 cursor-pointer"
                      title="Excluir lançamento"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}