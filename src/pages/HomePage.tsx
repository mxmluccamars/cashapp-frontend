import { useEffect, useMemo, useState } from 'react';
import { Eye, EyeOff, Loader2, AlertTriangle } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import { MonthSelector } from '../components/home/MonthSelector';
import { BalanceCard } from '../components/home/BalanceCard';
import { QuickShortcuts } from '../components/home/QuickShortcuts';
import { RecentTransactions } from '../components/home/RecentTransactions';
import { GoalsView } from './home/GoalsView';

interface HomePageProps {
  onOpenExtrato: () => void;
  onSubScreenChange?: (isOpen: boolean) => void;
}

type HomeSubScreen = 'main' | 'goals' | 'recurring';

export function HomePage({ onOpenExtrato, onSubScreenChange }: HomePageProps) {
  const { currentTheme } = useTheme();
  const {
    transactions,
    categories,
    paymentMethods,
    goals,
    recurringBills,
    isLoadingTransactions,
    ensureHomeLoaded,
  } = useData();

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()); // 0 a 11
  const [hideValues, setHideValues] = useState(false);
  const [subScreen, setSubScreen] = useState<HomeSubScreen>('main');

  useEffect(() => {
    ensureHomeLoaded();
  }, [ensureHomeLoaded]);

  // Esconde a BottomNav quando abrir Caixinhas ou Recorrentes
  useEffect(() => {
    onSubScreenChange?.(subScreen !== 'main');
    return () => onSubScreenChange?.(false);
  }, [subScreen, onSubScreenChange]);

  const handlePrevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  // Filtra transações do mês/ano selecionado e ordena da mais recente para a mais antiga
  const monthTransactions = useMemo(() => {
    const prefix = `${year}-${String(month + 1).padStart(2, '0')}`;
    return transactions
      .filter((tx) => tx.date.startsWith(prefix))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions, year, month]);

  // Cálculos do Balanço (Entradas, Saídas, À Vista vs Cartão)
  const { income, expense, cashExpense, creditExpense } = useMemo(() => {
    const creditIds = new Set(
      paymentMethods
        .filter((pm) => pm.allows_installments || pm.allow_installments)
        .map((pm) => pm.id)
    );

    return monthTransactions.reduce(
      (acc, tx) => {
        const val = Number(tx.amount);
        if (tx.type === 'INCOME') {
          acc.income += val;
        } else {
          acc.expense += val;
          if (tx.payment_method_id && creditIds.has(tx.payment_method_id)) {
            acc.creditExpense += val;
          } else {
            acc.cashExpense += val;
          }
        }
        return acc;
      },
      { income: 0, expense: 0, cashExpense: 0, creditExpense: 0 }
    );
  }, [monthTransactions, paymentMethods]);

  // Radar de Tetos: categorias que passaram de 75% do monthly_limit neste mês
  const budgetAlerts = useMemo(() => {
    const spentByCat = new Map<string, number>();
    monthTransactions.forEach((tx) => {
      if (tx.type === 'EXPENSE') {
        spentByCat.set(tx.category_id, (spentByCat.get(tx.category_id) || 0) + Number(tx.amount));
      }
    });

    return categories
      .filter((c) => c.type === 'EXPENSE' && c.monthly_limit && Number(c.monthly_limit) > 0)
      .map((c) => {
        const spent = spentByCat.get(c.id) || 0;
        const limit = Number(c.monthly_limit);
        const pct = Math.round((spent / limit) * 100);
        return { category: c, spent, limit, pct };
      })
      .filter((item) => item.pct >= 75)
      .sort((a, b) => b.pct - a.pct);
  }, [categories, monthTransactions]);

  // Totais para os cards de atalho
  const goalsSavedTotal = useMemo(
    () =>
      transactions
        .filter((tx) => Boolean(tx.goal_id))
        .reduce((sum, tx) => sum + (tx.type === 'EXPENSE' ? Number(tx.amount) : -Number(tx.amount)), 0),
    [transactions]
  );

  const activeBills = recurringBills.filter((b) => b.is_active);
  const activeBillsTotal = activeBills.reduce((sum, b) => sum + Number(b.amount), 0);

  // Placeholders temporários para as telas de Caixinhas e Recorrentes (próximo passo)
  // if (subScreen !== 'main') {
  //   return (
  //     <div className="p-5 pb-10 max-w-md mx-auto">
  //       <button
  //         onClick={() => setSubScreen('main')}
  //         style={{ backgroundColor: currentTheme.bgCard, color: currentTheme.primaryText }}
  //         className="px-4 py-2 rounded-xl text-xs font-bold mb-6 cursor-pointer"
  //       >
  //         ← Voltar para Home
  //       </button>
  //       <h2 style={{ color: currentTheme.primaryText }} className="text-xl font-black uppercase">
  //         Em construção: {subScreen === 'goals' ? 'Caixinhas' : 'Contas Recorrentes'}
  //       </h2>
  //     </div>
  //   );
  // }

  if (subScreen === 'goals') {
    return <GoalsView onBack={() => setSubScreen('main')} />;
  }

  return (
    <div className="p-5 pb-28 max-w-md mx-auto flex flex-col gap-5">
      {/* Header: Logo da Equipe + Botão de Privacidade */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {currentTheme.logoUrl && (
            <img
              src={currentTheme.logoUrl}
              alt={currentTheme.name}
              className="h-8 w-auto max-w-[72px] object-contain"
            />
          )}
          <div>
            <span
              style={{ color: currentTheme.secondaryText }}
              className="text-[10px] font-bold uppercase tracking-widest block"
            >
              Cockpit
            </span>
            <h1 style={{ color: currentTheme.primaryText }} className="text-base font-black uppercase">
              CashApp
            </h1>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setHideValues((v) => !v)}
          style={{ backgroundColor: currentTheme.bgCard, color: currentTheme.primaryText }}
          className="p-2.5 rounded-xl cursor-pointer active:scale-90 transition-transform"
          title={hideValues ? 'Mostrar valores' : 'Ocultar valores'}
        >
          {hideValues ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>

      {/* Navegador de Mês */}
      <MonthSelector
        year={year}
        month={month}
        onPrev={handlePrevMonth}
        onNext={handleNextMonth}
      />

      {isLoadingTransactions ? (
        <div className="py-16 flex justify-center">
          <Loader2 className="animate-spin" size={28} style={{ color: currentTheme.primary }} />
        </div>
      ) : (
        <>
          {/* Card Principal de Balanço */}
          <BalanceCard
            income={income}
            expense={expense}
            cashExpense={cashExpense}
            creditExpense={creditExpense}
            hideValues={hideValues}
          />

          {/* Atalhos: Caixinhas e Contas Recorrentes */}
          <QuickShortcuts
            goalsCount={goals.length}
            goalsSavedTotal={goalsSavedTotal}
            activeBillsCount={activeBills.length}
            activeBillsTotal={activeBillsTotal}
            hideValues={hideValues}
            onOpenGoals={() => setSubScreen('goals')}
            onOpenRecurring={() => setSubScreen('recurring')}
          />

          {/* Radar de Tetos (Só aparece se alguma categoria passar de 75% do limite) */}
          {budgetAlerts.length > 0 && (
            <div
              style={{ backgroundColor: currentTheme.bgCard }}
              className="p-4 rounded-2xl flex flex-col gap-3"
            >
              <div className="flex items-center gap-2">
                <AlertTriangle size={15} className="text-amber-400" />
                <span
                  style={{ color: currentTheme.primaryText }}
                  className="text-xs font-black uppercase"
                >
                  Radar de Tetos
                </span>
              </div>

              {budgetAlerts.map(({ category, pct }) => (
                <div key={category.id} className="flex flex-col gap-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span style={{ color: currentTheme.primaryText }}>{category.name}</span>
                    <span className={pct >= 100 ? 'text-red-400' : 'text-amber-400'}>
                      {pct}% do limite
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                    <div
                      style={{ width: `${Math.min(pct, 100)}%` }}
                      className={`h-full rounded-full ${
                        pct >= 100 ? 'bg-red-500' : 'bg-amber-400'
                      }`}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Mini Extrato */}
          <RecentTransactions
            transactions={monthTransactions}
            categories={categories}
            hideValues={hideValues}
            onViewAll={onOpenExtrato}
          />
        </>
      )}
    </div>
  );
}