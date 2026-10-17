import React, { useEffect, useState } from 'react';
import { api } from './api/client';
import type { Category, Transaction } from './types';
import { useTheme } from './context/ThemeContext';
import { Header } from './components/Header';
import { Garage } from './components/Garage';
import { 
  ArrowDownCircle, 
  ArrowUpCircle, 
  Wallet, 
  PlusCircle, 
  Trash2,
  Gauge,
  Settings
} from 'lucide-react';

export default function App() {
  const { currentTheme } = useTheme();
  
  // Controle de abas simples: 'telemetry' (dashboard) ou 'garage' (configurações)
  const [currentTab, setCurrentTab] = useState<'telemetry' | 'garage'>('telemetry');

  // Estados dos dados da API
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados do formulário
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');
  const [categoryId, setCategoryId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [cats, txs] = await Promise.all([
        api.getCategories().catch(() => []),
        api.getTransactions().catch(() => [])
      ]);

      const safeCats = Array.isArray(cats) ? cats : [];
      const safeTxs = Array.isArray(txs) ? txs : [];

      setCategories(safeCats);
      setTransactions(safeTxs);

      if (safeCats.length > 0 && !categoryId) {
        setCategoryId(safeCats[0].id);
      }
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount || !categoryId) {
      alert('Preencha os campos obrigatórios!');
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
      setDescription('');
      setAmount('');
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Erro ao registrar movimentação');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja apagar este lançamento?')) return;
    try {
      await api.deleteTransaction(id);
      await loadData();
    } catch (err) {
      alert('Falha ao excluir lançamento');
    }
  };

  // Cálculos de saldo
  const safeTransactions = Array.isArray(transactions) ? transactions : [];
  const totalIncome = safeTransactions
    .filter(t => t.type === 'INCOME')
    .reduce((acc, t) => acc + Number(t.amount || 0), 0);

  const totalExpense = safeTransactions
    .filter(t => t.type === 'EXPENSE')
    .reduce((acc, t) => acc + Number(t.amount || 0), 0);

  const balance = totalIncome - totalExpense;

  return (
    <div className="min-h-screen pb-24 text-slate-100 transition-colors duration-300">
      {/* Header F1 com o logo da escuderia ativa */}
      <Header onOpenGarage={() => setCurrentTab('garage')} />

      <main className="max-w-4xl mx-auto px-4 mt-6">
        {currentTab === 'garage' ? (
          /* Aba: Garage (Configurações da Escuderia) */
          <Garage onBack={() => setCurrentTab('telemetry')} />
        ) : (
          /* Aba: Telemetry (Dashboard Principal) */
          <div className="space-y-6">
            {/* Cards de Telemetria Financeira */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div 
                className="p-5 rounded-2xl border border-slate-800 shadow-lg backdrop-blur-md"
                style={{ backgroundColor: currentTheme.bgCard }}
              >
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">Entradas / Boost</span>
                  <ArrowUpCircle className="w-5 h-5 text-emerald-400" />
                </div>
                <p className="text-2xl font-black text-emerald-400 tracking-tight">
                  R$ {totalIncome.toFixed(2)}
                </p>
              </div>

              <div 
                className="p-5 rounded-2xl border border-slate-800 shadow-lg backdrop-blur-md"
                style={{ backgroundColor: currentTheme.bgCard }}
              >
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">Despesas / Wear</span>
                  <ArrowDownCircle className="w-5 h-5 text-rose-400" />
                </div>
                <p className="text-2xl font-black text-rose-400 tracking-tight">
                  R$ {totalExpense.toFixed(2)}
                </p>
              </div>

              <div 
                className="p-5 rounded-2xl border border-slate-800 shadow-lg backdrop-blur-md"
                style={{ backgroundColor: currentTheme.bgCard }}
              >
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">Saldo / Fuel</span>
                  <Wallet className="w-5 h-5" style={{ color: currentTheme.primary }} />
                </div>
                <p className="text-2xl font-black tracking-tight" style={{ color: balance >= 0 ? currentTheme.primary : '#fb7185' }}>
                  R$ {balance.toFixed(2)}
                </p>
              </div>
            </section>

            {/* Formulário: Pit Stop (Novo Lançamento) */}
            <section 
              className="p-6 rounded-2xl border border-slate-800 shadow-lg backdrop-blur-md"
              style={{ backgroundColor: currentTheme.bgCard }}
            >
              <h2 className="text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2 text-white">
                <PlusCircle className="w-5 h-5" style={{ color: currentTheme.primary }} />
                Pit Stop • Novo Registro
              </h2>

              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                    Descrição
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Padaria, Combustível, Salário..."
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    required
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-white/60 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                    Valor (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    required
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-white/60 transition"
                  />
                </div>

                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                      Tipo
                    </label>
                    <select
                      value={type}
                      onChange={e => setType(e.target.value as 'EXPENSE' | 'INCOME')}
                      className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-white/60 transition"
                    >
                      <option value="EXPENSE">Despesa</option>
                      <option value="INCOME">Receita</option>
                    </select>
                  </div>

                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                      Categoria
                    </label>
                    <select
                      value={categoryId}
                      onChange={e => setCategoryId(e.target.value)}
                      required
                      className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-white/60 transition"
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
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                    Data
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    required
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-white/60 transition"
                  />
                </div>

                <div className="md:col-span-2 pt-2">
                  <button
                    type="submit"
                    className="w-full text-white font-bold py-3 rounded-xl text-sm transition-all duration-200 shadow-md cursor-pointer hover:opacity-95 active:scale-[0.99]"
                    style={{ backgroundColor: currentTheme.primary }}
                  >
                    Confirmar Lançamento
                  </button>
                </div>
              </form>
            </section>

            {/* Extrato: Voltas / Movimentações */}
            <section 
              className="p-6 rounded-2xl border border-slate-800 shadow-lg backdrop-blur-md"
              style={{ backgroundColor: currentTheme.bgCard }}
            >
              <h2 className="text-sm font-bold uppercase tracking-wider mb-4 text-white">
                Histórico Recente
              </h2>

              {loading ? (
                <p className="text-sm text-slate-400">Sincronizando com a telemetria...</p>
              ) : safeTransactions.length === 0 ? (
                <p className="text-sm text-slate-400">Nenhum lançamento registrado até o momento.</p>
              ) : (
                <div className="divide-y divide-slate-800">
                  {safeTransactions.map(tx => (
                    <div key={tx.id} className="py-3.5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span 
                          className="w-3.5 h-3.5 rounded-full shrink-0"
                          style={{ backgroundColor: tx.category?.color || '#94a3b8' }}
                        />
                        <div>
                          <p className="text-sm font-medium text-white">{tx.description}</p>
                          <p className="text-xs text-slate-400">
                            {tx.date} • {tx.category?.name || 'Geral'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <span className={`text-sm font-bold ${
                          tx.type === 'INCOME' ? 'text-emerald-400' : 'text-slate-100'
                        }`}>
                          {tx.type === 'INCOME' ? '+' : '-'} R$ {Number(tx.amount).toFixed(2)}
                        </span>
                        <button 
                          onClick={() => handleDelete(tx.id)}
                          className="text-slate-500 hover:text-rose-400 transition p-1 cursor-pointer"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </main>

      {/* Barra de Navegação Inferior (Mobile First) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/90 border-t border-slate-800 backdrop-blur-lg px-6 py-2.5">
        <div className="max-w-md mx-auto flex items-center justify-around">
          <button
            onClick={() => setCurrentTab('telemetry')}
            className={`flex flex-col items-center gap-1 text-xs font-semibold transition cursor-pointer ${
              currentTab === 'telemetry' ? 'text-white' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Gauge 
              className="w-5 h-5" 
              style={{ color: currentTab === 'telemetry' ? currentTheme.primary : undefined }} 
            />
            <span>Telemetria</span>
          </button>

          <button
            onClick={() => setCurrentTab('garage')}
            className={`flex flex-col items-center gap-1 text-xs font-semibold transition cursor-pointer ${
              currentTab === 'garage' ? 'text-white' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Settings 
              className="w-5 h-5" 
              style={{ color: currentTab === 'garage' ? currentTheme.primary : undefined }} 
            />
            <span>Garage</span>
          </button>
        </div>
      </nav>
    </div>
  );
}