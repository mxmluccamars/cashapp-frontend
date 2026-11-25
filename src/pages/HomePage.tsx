import { useEffect, useMemo, useState } from 'react';
import { Eye, EyeOff, Loader2, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import { getAppLocale } from '../i18n';
import { formatCurrency } from '../utils/format';
import { MonthSelector } from '../components/home/MonthSelector';
import { BalanceCard } from '../components/home/BalanceCard';
import { QuickShortcuts } from '../components/home/QuickShortcuts';
import { RecentTransactions } from '../components/home/RecentTransactions';
import { GoalsView } from './home/GoalsView';
import { RecurringBillsView } from './home/RecurringBillsView';

interface HomePageProps {
  onOpenExtrato: () => void;
  onSubScreenChange?: (isOpen: boolean) => void;
}

type HomeSubScreen = 'main' | 'goals' | 'recurring';

const HIDE_VALUES_KEY = 'cashapp_hide_values';

export function HomePage({ onOpenExtrato, onSubScreenChange }: HomePageProps) {
  const { currentTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const locale = getAppLocale(i18n.language);

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
  const [month, setMonth] = useState(now.getMonth());
  const [hideValues, setHideValues] = useState<boolean>(() => {
    try {
      return localStorage.getItem(HIDE_VALUES_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [subScreen, setSubScreen] = useState<HomeSubScreen>('main');

  useEffect(() => {
    ensureHomeLoaded();
  }, [ensureHomeLoaded]);

  useEffect(() => {
    onSubScreenChange?.(subScreen !== 'main');
    return () => onSubScreenChange?.(false);
  }, [subScreen, onSubScreenChange]);

  const toggleHideValues = () => {
    setHideValues((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(HIDE_VALUES_KEY, String(next));
      } catch {
        // Ignora falha de storage em modo privado
      }
      return next;
    });
  };

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

  const monthTransactions = useMemo(() => {
    const prefix = `${year}-${String(month + 1).padStart(2, '0')}`;
    return transactions
      .filter((tx) => tx.date.startsWith(prefix))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions, year, month]);

  const { income, expense, cashExpense, creditExpense } = useMemo(() => {
    const creditIds = new Set(
      paymentMethods
        .filter((pm) => Boolean(pm.allow_installments || pm.allows_installments))
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

  const budgetAlerts = useMemo(() => {
    const spentByCat = new Map<string, number>();
    monthTransactions.forEach((tx) => {
      if (tx.type === 'EXPENSE') {
        spentByCat.set(
          tx.category_id,
          (spentByCat.get(tx.category_id) || 0) + Number(tx.amount)
        );
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

  const goalsSavedTotal = useMemo(
    () =>
      transactions
        .filter((tx) => Boolean(tx.goal_id))
        .reduce(
          (sum, tx) => sum + (tx.type === 'EXPENSE' ? Number(tx.amount) : -Number(tx.amount)),
          0
        ),
    [transactions]
  );

  const activeBills = recurringBills.filter((b) => b.is_active);
  const activeBillsTotal = activeBills.reduce((sum, b) => sum + Number(b.amount), 0);

  if (subScreen === 'goals') {
    return <GoalsView onBack={() => setSubScreen('main')} />;
  }

  if (subScreen === 'recurring') {
    return (
      <RecurringBillsView
        year={year}
        month={month}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        onBack={() => setSubScreen('main')}
      />
    );
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
              {t('home.cockpit')}
            </span>
            <h1 style={{ color: currentTheme.primaryText }} className="text-base font-black uppercase">
              CashApp
            </h1>
          </div>
        </div>

        <button
          type="button"
          onClick={toggleHideValues}
          aria-label={hideValues ? t('home.showValues') : t('home.hideValues')}
          title={hideValues ? t('home.showValues') : t('home.hideValues')}
          style={{ backgroundColor: currentTheme.bgCard, color: currentTheme.primaryText }}
          className="p-2.5 rounded-xl cursor-pointer active:scale-90 transition-transform"
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
          <BalanceCard
            income={income}
            expense={expense}
            cashExpense={cashExpense}
            creditExpense={creditExpense}
            hideValues={hideValues}
          />

          <QuickShortcuts
            goalsCount={goals.length}
            goalsSavedTotal={goalsSavedTotal}
            activeBillsCount={activeBills.length}
            activeBillsTotal={activeBillsTotal}
            hideValues={hideValues}
            onOpenGoals={() => setSubScreen('goals')}
            onOpenRecurring={() => setSubScreen('recurring')}
          />

          {/* Radar de Tetos */}
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
                  {t('home.budgetRadar')}
                </span>
              </div>

              {budgetAlerts.map(({ category, spent, limit, pct }) => (
                <div key={category.id} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between gap-2 text-xs font-bold">
                    <span style={{ color: currentTheme.primaryText }} className="truncate">
                      {category.name}
                    </span>
                    <span className={`shrink-0 ${pct >= 100 ? 'text-red-400' : 'text-amber-400'}`}>
                      {t('home.limitPct', { pct })}
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
                  {!hideValues && (
                    <span
                      style={{ color: currentTheme.secondaryText }}
                      className="text-[10px] font-medium"
                    >
                      {formatCurrency(spent, locale)} / {formatCurrency(limit, locale)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

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